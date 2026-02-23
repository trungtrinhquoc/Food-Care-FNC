import { useState } from 'react';
import { Package, Mail, BarChart3 } from 'lucide-react';
import SubscriptionsList from '@/components/admin/SubscriptionsList';
import EmailManagementTab from '@/components/admin/EmailManagementTab';
import SubscriptionStatsTab from '@/components/admin/SubscriptionStatsTab';

type SubTab = 'list' | 'email' | 'stats';

export function SubscriptionsTab() {
    const [activeSubTab, setActiveSubTab] = useState<SubTab>('list');

    const subTabs = [
        { id: 'list' as SubTab, label: 'Danh Sách', icon: Package },
        { id: 'email' as SubTab, label: 'Quản Lý Email', icon: Mail },
        { id: 'stats' as SubTab, label: 'Thống Kê', icon: BarChart3 },
    ];

    return (
        <div className="space-y-4">
            {/* Sub-tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                <div className="flex gap-1">
                    {subTabs.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveSubTab(id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${activeSubTab === id
                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-orange-600'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Sub-tab Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {activeSubTab === 'list' && <SubscriptionsList />}
                {activeSubTab === 'email' && <EmailManagementTab />}
                {activeSubTab === 'stats' && <SubscriptionStatsTab />}
            </div>
        </div>
    );
}
