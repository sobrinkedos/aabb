// Test script to verify employee creation fix
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wznycskqsavpmejwpksp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bnljc2txc2F2cG1landwa3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MzA2NjUsImV4cCI6MjA3MjIwNjY2NX0.uYXbBwQDo1pLeBrmtZnBR2M3a3_TsYDa637pcKSVC_8';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to set this

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testEmployeeCreation() {
  console.log('🧪 Testing employee creation...');

  try {
    // Test data
    const employeeData = {
      name: 'Maria Santos',
      cpf: '987.654.321-00',
      email: 'maria@teste.com',
      phone: '(11) 88888-8888',
      bar_role: 'atendente',
      shift_preference: 'manha',
      specialties: ['atendimento', 'caixa'],
      commission_rate: 3.0,
      notes: 'Funcionária experiente'
    };

    // Build notes
    const notesArray = [];
    if (employeeData.name) notesArray.push(`Nome: ${employeeData.name}`);
    if (employeeData.cpf) notesArray.push(`CPF: ${employeeData.cpf}`);
    if (employeeData.email) notesArray.push(`Email: ${employeeData.email}`);
    if (employeeData.phone) notesArray.push(`Telefone: ${employeeData.phone}`);
    if (employeeData.notes) notesArray.push(`Observações: ${employeeData.notes}`);
    
    const cleanNotes = notesArray.join(', ');

    // Try with admin client (should work)
    console.log('📝 Attempting to create employee with admin client...');
    
    const { data: newEmployee, error } = await supabaseAdmin
      .from('bar_employees')
      .insert([{
        employee_id: null,
        bar_role: employeeData.bar_role,
        shift_preference: employeeData.shift_preference || 'qualquer',
        specialties: employeeData.specialties || [],
        commission_rate: employeeData.commission_rate || 0,
        is_active: true,
        start_date: new Date().toISOString().split('T')[0],
        notes: cleanNotes,
        empresa_id: '00000000-0000-0000-0000-000000000001'
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating employee:', error);
      return;
    }

    console.log('✅ Employee created successfully!');
    console.log('📋 Employee details:', {
      id: newEmployee.id,
      bar_role: newEmployee.bar_role,
      notes: newEmployee.notes,
      empresa_id: newEmployee.empresa_id
    });

    // Test fetching employees
    console.log('📖 Testing employee fetch...');
    
    const { data: employees, error: fetchError } = await supabaseAdmin
      .from('bar_employees')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (fetchError) {
      console.error('❌ Error fetching employees:', fetchError);
      return;
    }

    console.log(`✅ Successfully fetched ${employees.length} employees`);
    console.log('👥 Recent employees:', employees.map(emp => ({
      id: emp.id,
      role: emp.bar_role,
      name: emp.notes?.match(/Nome: ([^,]+)/)?.[1] || 'N/A'
    })));

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if service role key is available
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  testEmployeeCreation();
} else {
  console.log('⚠️ SUPABASE_SERVICE_ROLE_KEY not set. Skipping test.');
  console.log('💡 To run this test, set the environment variable with your service role key.');
}