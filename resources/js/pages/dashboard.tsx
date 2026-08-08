import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Dashboard() {
    const form = useForm({name: '', email: '', phone: '', address: '', position: ''});

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post('employees', {
            onSuccess: () => form.reset(),
        });
    }
    
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div>
                    <h1 className="text-x1 font-semibold">Employees</h1>
                    <p className="text-sm text-muted-foreground">
                        Add a new Employee
                    </p>

                <form onSubmit = {submit} className="max-w-x1 space-y-2 rounded-x1 border p-4">
                    
                    <div className="space-y-2">
                    <label htmlFor="name">Name</label>
                    <Input 
                        id="name" 
                        value={form.data.name} 
                        placeholder="Enter employee name"
                        onChange={(event)=> form.setData('name', event.target.value)}
                        />
                        {form.errors.name && <p className="text-sm text-red-600">{form.errors.name}</p>} 
                    </div>


                    <div className="space-y-2">
                    <label htmlFor="email">Email</label>
                    <Input 
                        id="email" 
                        value={form.data.email} 
                        placeholder="Enter work email"
                        onChange={(event)=> form.setData('email', event.target.value)}
                        />
                        {form.errors.email && <p className="text-sm text-red-600">{form.errors.email}</p>} 
                    </div>
                    <div className="space-y-2">
                    <label htmlFor="phone">Phone</label>
                    <Input 
                        id="phone" 
                        value={form.data.phone} 
                        placeholder="Enter employee phone"
                        onChange={(event)=> form.setData('phone', event.target.value)}
                        />
                        {form.errors.phone && <p className="text-sm text-red-600">{form.errors.phone}</p>} 

                    </div>
                    <div className="space-y-2">
                    <label htmlFor="address">Address</label>
                    <Input 
                        id="address" 
                        value={form.data.address} 
                        placeholder="Enter employee address"
                        onChange={(event)=> form.setData('address', event.target.value)}
                        />
                        {form.errors.address && <p className="text-sm text-red-600">{form.errors.address}</p>} 
                    </div>
                    <div className="space-y-2">
                    <label htmlFor="position">Position</label>
                    <Input 
                        id="position" 
                        value={form.data.position} 
                        placeholder="Enter employee position"
                        onChange={(event)=> form.setData('position', event.target.value)}
                        />
                        {form.errors.position && <p className="text-sm text-red-600">{form.errors.position}</p>}

                    </div>
                    <Button type="submit" disabled={form.processing}>Save Employee</Button>
                </form>



                </div>          
            </div>
        </> 
    );
};                                                                                                             
Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
}; 
