import { Card } from '@/components/ui/card';
import { Icons } from '@/components/dashboard/Icons';

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Members</p>
                            <h3 className="text-2xl font-bold">1,234</h3>
                        </div>
                        <Icons.users className="h-6 w-6 text-church-primary" />
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Weekly Attendance</p>
                            <h3 className="text-2xl font-bold">876</h3>
                        </div>
                        <Icons.calendar className="h-6 w-6 text-church-primary" />
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Monthly Donations</p>
                            <h3 className="text-2xl font-bold">$24,567</h3>
                        </div>
                        <Icons.donate className="h-6 w-6 text-church-primary" />
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Upcoming Events</p>
                            <h3 className="text-2xl font-bold">12</h3>
                        </div>
                        <Icons.calendar className="h-6 w-6 text-church-primary" />
                    </div>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                    {/* Activity timeline would go here */}
                </Card>
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <button className="w-full btn btn-outline">
                            Add New Member
                        </button>
                        <button className="w-full btn btn-outline">
                            Create Event
                        </button>
                        <button className="w-full btn btn-outline">
                            Generate Report
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
}