// CORREÇÃO RÁPIDA - EXECUTAR NO CONSOLE DO NAVEGADOR
// Execute este código no console do seu sistema (F12) para corrigir o role do funcionário

async function corrigirRoleFuncionario() {
    const supabase = window.supabase.createClient(
        'https://wznycskqsavpmejwpksp.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bnljc2txc2F2cG1landwa3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MzA2NjUsImV4cCI6MjA3MjIwNjY2NX0.uYXbBwQDo1pLeBrmtZnBR2M3a3_TsYDa637pcKSVC_8'
    );

    try {
        console.log('🔧 Corrigindo role do funcionário...');
        
        // 1. Buscar o último funcionário criado com role admin
        const { data: profiles, error: fetchError } = await supabase
            .from('profiles')
            .select('id, name, role, created_at')
            .eq('role', 'admin')
            .order('created_at', { ascending: false })
            .limit(5);

        if (fetchError) {
            console.error('❌ Erro ao buscar perfis:', fetchError);
            return;
        }

        if (!profiles || profiles.length === 0) {
            console.log('ℹ️ Nenhum funcionário com role "admin" encontrado');
            return;
        }

        console.log('👥 Funcionários com role "admin" encontrados:', profiles);

        // 2. Atualizar todos os funcionários de admin para employee
        for (const profile of profiles) {
            console.log(`🔄 Corrigindo ${profile.name} (${profile.id})...`);
            
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ role: 'employee' })
                .eq('id', profile.id);

            if (updateError) {
                console.error(`❌ Erro ao atualizar ${profile.name}:`, updateError);
            } else {
                console.log(`✅ ${profile.name} atualizado para role "employee"`);
            }
        }

        console.log('🎉 Correção concluída! Todos os funcionários agora têm role "employee"');

    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

// Executar a correção
corrigirRoleFuncionario();