'use client';

import { createClient } from '@/lib/supabaseClient';
import { useState } from 'react';

export default function SimpleCrud({ table, title }: { table: string, title: string }) {
    const [name, setName] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    // Fetch items on mount
    useState(() => {
        const fetchItems = async () => {
            const { data } = await supabase.from(table).select('*').order('created_at', { ascending: true });
            if (data) setItems(data);
        };
        fetchItems();
    });

    const handleAdd = async () => {
        if (!name.trim()) return;
        setLoading(true);
        const { error } = await supabase.from(table).insert({ name });
        setLoading(false);

        if (!error) {
            setName('');
            // Refresh list locally or reload
            window.location.reload();
        } else {
            alert('Error adding: ' + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (!error) {
            setItems(items.filter(i => i.id !== id));
        } else {
            alert('Error deleting: ' + error.message);
        }
    }

    return (
        <div className="bg-white p-6 rounded shadow mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-800">{title}s</h3>

            {/* List Existing */}
            <ul className="mb-4 space-y-2 max-h-40 overflow-y-auto">
                {items.length === 0 && <li className="text-gray-400 text-sm italic">No {title.toLowerCase()}s found.</li>}
                {items.map(item => (
                    <li key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border">
                        <span className="text-gray-700 font-medium">{item.name}</span>
                        <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-500 hover:text-red-700 text-xs px-2 py-1"
                        >
                            Delete
                        </button>
                    </li>
                ))}
            </ul>

            {/* Add New */}
            <div className="flex gap-2 mt-4 pt-4 border-t">
                <input
                    className="border p-2 rounded flex-1 text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder={`Add new ${title}...`}
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                <button
                    onClick={handleAdd}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
                >
                    {loading ? '...' : 'Add'}
                </button>
            </div>
        </div>
    );
}
