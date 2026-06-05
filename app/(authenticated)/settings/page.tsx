'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import SimpleCrud from '@/components/SimpleCrud';
import { createClient } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Building, Webhook, Layers, Save, Loader2 } from 'lucide-react';

type Tab = 'general' | 'integrations' | 'masters';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const supabase = createClient();

    // Form states
    const [companyName, setCompanyName] = useState('HR PORTAL ENTERPRISE');
    const [companyAddress, setCompanyAddress] = useState('123 Corporate Boulevard, Suite 500');
    const [companyContact, setCompanyContact] = useState('Contact: hr@yourcompany.com | +1 (555) 019-9000');
    const [siteUrl, setSiteUrl] = useState('http://localhost:3000');
    const [webhookSecret, setWebhookSecret] = useState('super_secure_webhook_secret_key');
    const [slackUrl, setSlackUrl] = useState('');
    const [resendKey, setResendKey] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('system_settings')
                    .select('*');
                
                if (data) {
                    data.forEach((setting) => {
                        switch (setting.key) {
                            case 'COMPANY_NAME':
                                setCompanyName(setting.value);
                                break;
                            case 'COMPANY_ADDRESS':
                                setCompanyAddress(setting.value);
                                break;
                            case 'COMPANY_CONTACT':
                                setCompanyContact(setting.value);
                                break;
                            case 'NEXT_PUBLIC_SITE_URL':
                                setSiteUrl(setting.value);
                                break;
                            case 'WEBHOOK_SECRET':
                                setWebhookSecret(setting.value);
                                break;
                            case 'SLACK_WEBHOOK_URL':
                                setSlackUrl(setting.value);
                                break;
                            case 'RESEND_API_KEY':
                                setResendKey(setting.value);
                                break;
                            default:
                                break;
                        }
                    });
                }
            } catch (err) {
                console.error("Error fetching settings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [supabase]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const settingsToSave = [
            { key: 'COMPANY_NAME', value: companyName },
            { key: 'COMPANY_ADDRESS', value: companyAddress },
            { key: 'COMPANY_CONTACT', value: companyContact },
            { key: 'NEXT_PUBLIC_SITE_URL', value: siteUrl },
            { key: 'WEBHOOK_SECRET', value: webhookSecret },
            { key: 'SLACK_WEBHOOK_URL', value: slackUrl },
            { key: 'RESEND_API_KEY', value: resendKey },
        ];

        try {
            const { error } = await supabase
                .from('system_settings')
                .upsert(settingsToSave);

            if (error) throw error;
            toast.success("Settings updated successfully!");
        } catch (err: any) {
            toast.error("Failed to save settings: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <PageHeader title="Admin Settings" description="Configure company details, webhook connections, and organizational parameters." />

            {/* Tabs Navigation */}
            <div className="flex space-x-2 border-b border-slate-200">
                {[
                    { id: 'general', name: 'General Settings', icon: Building },
                    { id: 'integrations', name: 'Webhooks & APIs', icon: Webhook },
                    { id: 'masters', name: 'Organizational Structure', icon: Layers }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={`flex items-center space-x-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
                            activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span>{tab.name}</span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-48 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-3 text-slate-500 font-medium">Loading system configurations...</span>
                </div>
            ) : (
                <div className="mt-6">
                    {/* General Settings Tab */}
                    {activeTab === 'general' && (
                        <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
                            <h3 className="text-lg font-bold text-slate-900">Company Identity</h3>
                            
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Company Name</label>
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={e => setCompanyName(e.target.value)}
                                        className="block w-full rounded-lg border border-slate-200 p-2.5 text-sm"
                                        placeholder="HR PORTAL ENTERPRISE"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Address</label>
                                    <input
                                        type="text"
                                        value={companyAddress}
                                        onChange={e => setCompanyAddress(e.target.value)}
                                        className="block w-full rounded-lg border border-slate-200 p-2.5 text-sm"
                                        placeholder="123 Corporate Boulevard, Suite 500"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Contact Information</label>
                                    <input
                                        type="text"
                                        value={companyContact}
                                        onChange={e => setCompanyContact(e.target.value)}
                                        className="block w-full rounded-lg border border-slate-200 p-2.5 text-sm"
                                        placeholder="Contact: hr@yourcompany.com | +1 (555) 019-9000"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-slate-100">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save General Settings
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Webhooks & APIs Tab */}
                    {activeTab === 'integrations' && (
                        <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Event-Driven Automation</h3>
                                <p className="text-xs text-slate-500 mt-1">Configure your local or production connection strings for outbound webhook delivery.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Next.js Site URL</label>
                                    <input
                                        type="url"
                                        value={siteUrl}
                                        onChange={e => setSiteUrl(e.target.value)}
                                        className="block w-full rounded-lg border border-slate-200 p-2.5 text-sm"
                                        placeholder="http://localhost:3000"
                                        required
                                    />
                                    <p className="text-[10px] text-slate-400">The base URL used by Supabase pg_net triggers to contact the endpoint `/api/webhooks/hr-events`.</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Webhook Secret Key</label>
                                    <input
                                        type="text"
                                        value={webhookSecret}
                                        onChange={e => setWebhookSecret(e.target.value)}
                                        className="block w-full rounded-lg border border-slate-200 p-2.5 text-sm font-mono"
                                        placeholder="super_secure_webhook_secret_key"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Slack Webhook URL</label>
                                    <input
                                        type="text"
                                        value={slackUrl}
                                        onChange={e => setSlackUrl(e.target.value)}
                                        className="block w-full rounded-lg border border-slate-200 p-2.5 text-sm font-mono"
                                        placeholder="https://hooks.slack.com/services/..."
                                    />
                                </div>

                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Resend API Key (Transactional Email)</label>
                                    <input
                                        type="password"
                                        value={resendKey}
                                        onChange={e => setResendKey(e.target.value)}
                                        className="block w-full rounded-lg border border-slate-200 p-2.5 text-sm font-mono"
                                        placeholder="re_..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-slate-100">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save Integrations Settings
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Masters Data Tab */}
                    {activeTab === 'masters' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <SimpleCrud table="department" title="Department" />
                            <SimpleCrud table="designation" title="Designation" />
                            <div className="md:col-span-2">
                                <SimpleCrud table="leave_policy" title="Leave Policy" />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
