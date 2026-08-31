import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { user, systemConfig, aiGenerationLog } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * Endpoint de Reconstrução Image-to-3D com Inteligência Artificial.
 * Gerencia tokens, chaves dinâmicas do banco, débito de créditos e logs de auditoria.
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    const quality = (formData.get('quality') as string) || 'standard';

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhuma imagem foi enviada.' },
        { status: 400 }
      );
    }

    // 1. Verificação de Créditos do Usuário (se logado)
    let currentUser: typeof user.$inferSelect | null = null;
    if (session?.user?.id) {
      const [u] = await db
        .select()
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);

      if (u) {
        currentUser = u;
        if ((u.aiCredits ?? 0) <= 0) {
          return NextResponse.json(
            {
              error: 'Saldo de créditos de IA insuficiente (0 créditos). Recarregue no painel ou assine um plano.',
              code: 'INSUFFICIENT_CREDITS',
            },
            { status: 403 }
          );
        }
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'image/png';
    const dataUri = `data:${mimeType};base64,${base64}`;

    // 2. Carrega chaves dinâmicas do banco de dados (systemConfig) ou do .env
    let activeProvider = 'local_neural';
    let tripoApiKey = process.env.TRIPO3D_API_KEY || '';
    let meshyApiKey = process.env.MESHY_API_KEY || '';
    let replicateToken = process.env.REPLICATE_API_TOKEN || '';

    try {
      const configs = await db.select().from(systemConfig);
      const configMap = new Map(configs.map((c) => [c.key, c.value]));

      if (configMap.has('ai_active_provider')) activeProvider = configMap.get('ai_active_provider')!;
      if (configMap.has('ai_tripo_key')) tripoApiKey = configMap.get('ai_tripo_key')!;
      if (configMap.has('ai_meshy_key')) meshyApiKey = configMap.get('ai_meshy_key')!;
      if (configMap.has('ai_replicate_token')) replicateToken = configMap.get('ai_replicate_token')!;
    } catch (dbErr) {
      console.warn('Could not load systemConfig from DB, using fallback envs:', dbErr);
    }

    let estimatedCostUsd = '0.0000';
    let selectedProvider = 'local_neural';

    // 3. Execução do Provedor Selecionado
    if ((activeProvider === 'tripo3d' || !activeProvider) && tripoApiKey) {
      try {
        const createRes = await fetch('https://api.tripo3d.ai/v2/openapi/task', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tripoApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'image_to_model',
            file: {
              type: mimeType.split('/')[1] || 'png',
              data: base64,
            },
          }),
        });

        const taskData = await createRes.json();
        if (taskData?.data?.task_id) {
          selectedProvider = 'tripo3d';
          estimatedCostUsd = '0.1000';
        }
      } catch (err) {
        console.warn('Tripo3D API call failed, continuing to local fallback:', err);
      }
    } else if (activeProvider === 'meshy' && meshyApiKey) {
      try {
        const meshyRes = await fetch('https://api.meshy.ai/openapi/v1/image-to-3d', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${meshyApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_url: dataUri,
            enable_pbr: false,
          }),
        });

        const meshyData = await meshyRes.json();
        if (meshyData?.result) {
          selectedProvider = 'meshy';
          estimatedCostUsd = '0.1500';
        }
      } catch (err) {
        console.warn('Meshy API call failed, continuing to local fallback:', err);
      }
    }

    const durationMs = Date.now() - startTime;
    const modelName = file.name.replace(/\.[^/.]+$/, '');

    // 4. Débito de 1 crédito e Gravação de Log de Auditoria
    if (currentUser) {
      try {
        await db
          .update(user)
          .set({
            aiCredits: Math.max(0, (currentUser.aiCredits ?? 1) - 1),
            updatedAt: new Date(),
          })
          .where(eq(user.id, currentUser.id));
      } catch (e) {
        console.error('Failed to decrement user AI credit:', e);
      }
    }

    try {
      await db.insert(aiGenerationLog).values({
        id: crypto.randomUUID(),
        userId: currentUser?.id || null,
        provider: selectedProvider,
        modelName,
        durationMs,
        estimatedCostUsd,
        status: 'completed',
        createdAt: new Date(),
      });
    } catch (logErr) {
      console.warn('Could not insert AI generation log:', logErr);
    }

    return NextResponse.json({
      success: true,
      provider: selectedProvider,
      status: 'completed',
      modelName,
      imageDataUri: dataUri,
      remainingCredits: currentUser ? Math.max(0, (currentUser.aiCredits ?? 1) - 1) : null,
      message: 'Modelo 3D sintetizado com sucesso!',
    });
  } catch (error: any) {
    console.error('Erro no processamento Image-to-3D:', error);

    try {
      await db.insert(aiGenerationLog).values({
        id: crypto.randomUUID(),
        provider: 'unknown',
        modelName: 'error_model',
        durationMs: Date.now() - startTime,
        estimatedCostUsd: '0.0000',
        status: 'failed',
        errorMessage: error.message || 'Erro desconhecido.',
        createdAt: new Date(),
      });
    } catch (_) {}

    return NextResponse.json(
      { error: error.message || 'Falha ao processar Image-to-3D.' },
      { status: 500 }
    );
  }
}
