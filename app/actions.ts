'use server'

import { createAdminClient } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'

export async function createEmployeeAction(data: any) {
    const supabase = createAdminClient()
    
    // Map form fields to correct database columns
    const dbData = { ...data }
    if ('emp_code' in dbData) {
        if (!dbData.emp_code || dbData.emp_code.trim() === '') {
            // Remove to trigger database sequence default
            delete dbData.emp_code
        } else {
            dbData.employee_code = dbData.emp_code
            delete dbData.emp_code
        }
    }
    if ('dob' in dbData) {
        dbData.date_of_birth = dbData.dob || null
        delete dbData.dob
    }

    const { data: newEmp, error } = await supabase.from('employee').insert(dbData).select().single()

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/employees')
    return newEmp
}

export async function updateEmployeeAction(id: string, data: any) {
    const supabase = createAdminClient()
    
    // Map form fields to correct database columns
    const dbData = { ...data }
    if ('emp_code' in dbData) {
        if (!dbData.emp_code || dbData.emp_code.trim() === '') {
            delete dbData.emp_code
        } else {
            dbData.employee_code = dbData.emp_code
            delete dbData.emp_code
        }
    }
    if ('dob' in dbData) {
        dbData.date_of_birth = dbData.dob || null
        delete dbData.dob
    }

    const { error } = await supabase.from('employee').update(dbData).eq('id', id)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/employees')
    return { success: true }
}
