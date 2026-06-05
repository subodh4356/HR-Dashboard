'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import PageHeader from '@/components/PageHeader';
import { format } from 'date-fns';
import { 
    Loader2, 
    Search, 
    ChevronDown, 
    ChevronUp, 
    Activity, 
    Shield, 
    Database, 
    Info,
    SlidersHorizontal,
    Code,
    X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface AuditLog {
    id: string;
    action: string;
    entity: string;
    entity_id: string;
    details: any;
    created_at: string;
    user_id: string;
}

export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [entityFilter, setEntityFilter] = useState('All');
    const [actionFilter, setActionFilter] = useState('All');
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('audit_log')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(200);

            if (!error && data) {
                setLogs(data);
            }
        } catch (err) {
            console.error("Failed to load audit logs", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (id: string) => {
        if (expandedRowId === id) {
            setExpandedRowId(null);
        } else {
            setExpandedRowId(id);
        }
    };

    // Extract unique entities and actions for dropdown filters
    const uniqueEntities = Array.from(new Set(logs.map(log => log.entity))).filter(Boolean);
    const uniqueActions = Array.from(new Set(logs.map(log => log.action))).filter(Boolean);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = 
            log.action.toLowerCase().includes(search.toLowerCase()) ||
            log.entity.toLowerCase().includes(search.toLowerCase()) ||
            (log.entity_id && log.entity_id.toLowerCase().includes(search.toLowerCase())) ||
            (log.details && JSON.stringify(log.details).toLowerCase().includes(search.toLowerCase()));

        const matchesEntity = entityFilter === 'All' || log.entity === entityFilter;
        const matchesAction = actionFilter === 'All' || log.action === actionFilter;

        return matchesSearch && matchesEntity && matchesAction;
    });

    // Color mapper for actions
    const getActionBadgeColor = (action: string) => {
        const act = action.toUpperCase();
        if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('CANCEL')) {
            return 'bg-rose-50 text-rose-700 border-rose-200';
        }
        if (act.includes('CREATE') || act.includes('ADD') || act.includes('INSERT') || act.includes('PUNCH_IN')) {
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        }
        if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('MODIFY') || act.includes('PUNCH_OUT')) {
            return 'bg-amber-50 text-amber-700 border-amber-200';
        }
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    };

    // Syntax highlight logic for JSON details panel
    const renderJSONDetails = (details: any) => {
        if (!details) return <span className="text-slate-400 font-mono italic">No details logged.</span>;
        
        try {
            const pretty = JSON.stringify(details, null, 2);
            return (
                <pre className="font-mono text-xs text-slate-700 p-4 rounded-xl bg-slate-900 text-indigo-300 overflow-x-auto border border-slate-800 leading-relaxed shadow-inner">
                    {pretty.split('\n').map((line, index) => {
                        // Very basic visual highlight simulation
                        let lineClass = 'text-indigo-200';
                        if (line.includes('":')) {
                            lineClass = 'text-emerald-400';
                        }
                        if (line.match(/"\d{4}-\d{2}-\d{2}/)) {
                            lineClass = 'text-amber-450';
                        }
                        return (
                            <code key={index} className={`block ${lineClass}`}>
                                {line}
                            </code>
                        );
                    })}
                </pre>
            );
        } catch {
            return <span className="font-mono text-xs">{String(details)}</span>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader
                title="System Audit Logs"
                description="Monitor administrator commands, system settings overrides, and regulatory operations."
            />

            {/* Audit Log KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                    <div className="bg-indigo-50 p-3 rounded-xl text-indigo-650">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Operations</div>
                        <div className="text-2xl font-black text-slate-900 mt-0.5">{logs.length}</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                    <div className="bg-emerald-50 p-3 rounded-xl text-emerald-650">
                        <Database className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">Tracked Entities</div>
                        <div className="text-2xl font-black text-slate-900 mt-0.5">{uniqueEntities.length}</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                    <div className="bg-amber-50 p-3 rounded-xl text-amber-650">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Operations Logged</div>
                        <div className="text-2xl font-black text-slate-900 mt-0.5">{uniqueActions.length}</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                    <div className="bg-indigo-50/50 p-3 rounded-xl text-indigo-650">
                        <Info className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Storage Status</div>
                        <div className="text-[11px] font-bold text-indigo-700 mt-1 uppercase">Operational (RLS Active)</div>
                    </div>
                </div>
            </div>

            {/* Filter controls */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                        <SlidersHorizontal className="w-4.5 h-4.5 text-slate-500" />
                        Search & Filter Logs
                    </div>
                    {(search || entityFilter !== 'All' || actionFilter !== 'All') && (
                        <button
                            onClick={() => {
                                setSearch('');
                                setEntityFilter('All');
                                setActionFilter('All');
                            }}
                            className="text-xs font-semibold text-rose-650 hover:underline flex items-center gap-1"
                        >
                            <X className="w-3 h-3" /> Clear filters
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search actions, entities, details..."
                            className="pl-9 text-xs"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div>
                        <select
                            value={entityFilter}
                            onChange={(e) => setEntityFilter(e.target.value)}
                            className="w-full border border-slate-250 rounded-xl px-3 py-2 text-xs text-slate-700 bg-white"
                        >
                            <option value="All">Filter by Target Entity (All)</option>
                            {uniqueEntities.map(ent => (
                                <option key={ent} value={ent}>{ent}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <select
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="w-full border border-slate-250 rounded-xl px-3 py-2 text-xs text-slate-700 bg-white"
                        >
                            <option value="All">Filter by Action (All)</option>
                            {uniqueActions.map(act => (
                                <option key={act} value={act}>{act}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50 border-b border-slate-100">
                            <TableRow>
                                <th className="w-8"></th>
                                <TableHead className="w-[180px] font-semibold text-xs text-slate-500 uppercase p-4">Timestamp</TableHead>
                                <TableHead className="w-[180px] font-semibold text-xs text-slate-500 uppercase p-4">Action</TableHead>
                                <TableHead className="w-[160px] font-semibold text-xs text-slate-500 uppercase p-4">Entity Type</TableHead>
                                <TableHead className="w-[280px] font-semibold text-xs text-slate-500 uppercase p-4">Target ID (Reference)</TableHead>
                                <TableHead className="font-semibold text-xs text-slate-500 uppercase p-4">Quick Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-100">
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-650" />
                                        <span className="text-xs text-slate-400 mt-2 block font-medium">Decrypting security records...</span>
                                    </TableCell>
                                </TableRow>
                            ) : filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-500 text-xs font-semibold">
                                        No matching logs found in catalog.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map((log) => {
                                    const isExpanded = expandedRowId === log.id;
                                    const badgeStyles = getActionBadgeColor(log.action);

                                    return (
                                        <>
                                            <TableRow 
                                                key={log.id} 
                                                onClick={() => toggleRow(log.id)}
                                                className="hover:bg-slate-50/50 cursor-pointer transition"
                                            >
                                                <TableCell className="p-4 text-center">
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-4 h-4 text-slate-400" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-xs p-4 font-mono">
                                                    {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                                                </TableCell>
                                                <TableCell className="p-4 font-semibold text-xs">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] uppercase font-bold ${badgeStyles}`}>
                                                        {log.action}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="p-4">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                                                        {log.entity}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-mono text-[10px] text-slate-400 p-4">
                                                    {log.entity_id || '-'}
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate text-[11px] text-slate-500 p-4 font-mono">
                                                    {JSON.stringify(log.details)}
                                                </TableCell>
                                            </TableRow>
                                            {isExpanded && (
                                                <TableRow key={`exp-${log.id}`} className="bg-slate-50/70">
                                                    <TableCell colSpan={6} className="p-6">
                                                        <div className="space-y-4 max-w-4xl">
                                                            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 border-b border-slate-200 pb-2">
                                                                <span className="flex items-center gap-1.5">
                                                                    <Code className="w-4 h-4 text-indigo-650" />
                                                                    Extended Schema Payload & Variables
                                                                </span>
                                                                <span>Actor UUID: {log.user_id || 'System Process'}</span>
                                                            </div>
                                                            {renderJSONDetails(log.details)}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
