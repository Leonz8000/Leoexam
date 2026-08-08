import { Head, useForm } from '@inertiajs/react';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { dashboard } from '@/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';

const defaultSchedule = {
    title: '',
    employeeName: '',
    department: '',
    date: '',
    time: '',
    notes: '',
};

type ScheduleRecord = {
    id: string;
    title: string;
    employeeName: string;
    department: string;
    date: string;
    time: string;
    notes: string;
    createdAt?: { toDate?: () => Date } | null;
};

type AttendanceStatus = 'present' | 'absent';

type AttendanceEntry = {
    id: string;
    name: string;
    status: AttendanceStatus;
};

type TimeEntry = {
    timeIn: string;
    timeOut: string;
};

export default function Dashboard() {
    const form = useForm({ name: '', email: '', phone: '', address: '', position: '' });
    const [scheduleForm, setScheduleForm] = useState(defaultSchedule);
    const [scheduleMessage, setScheduleMessage] = useState('');
    const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
    const [loadingSchedules, setLoadingSchedules] = useState(true);
    const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
    const [attendanceDrafts, setAttendanceDrafts] = useState<Record<string, string>>({});
    const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceEntry[]>>({});
    const [timeEntries, setTimeEntries] = useState<Record<string, TimeEntry>>({});

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post('employees', {
            onSuccess: () => form.reset(),
        });
    }

    function updateScheduleField(field: keyof typeof defaultSchedule, value: string) {
        setScheduleForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    useEffect(() => {
        const schedulesQuery = query(collection(db, 'schedules'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(
            schedulesQuery,
            (snapshot) => {
                const nextSchedules = snapshot.docs.map((document) => ({
                    id: document.id,
                    ...document.data(),
                })) as ScheduleRecord[];

                setSchedules(nextSchedules);
                setLoadingSchedules(false);
            },
            (error) => {
                console.error('Error loading schedules:', error);
                setLoadingSchedules(false);
            },
        );

        return () => unsubscribe();
    }, []);

    async function submitSchedule(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setScheduleMessage('Saving schedule...');

        try {
            const payload = {
                ...scheduleForm,
            };

            if (editingScheduleId) {
                await updateDoc(doc(db, 'schedules', editingScheduleId), {
                    ...payload,
                    updatedAt: serverTimestamp(),
                });

                setScheduleMessage('Schedule updated in Firestore successfully.');
            } else {
                await addDoc(collection(db, 'schedules'), {
                    ...payload,
                    createdAt: serverTimestamp(),
                });

                setScheduleMessage('Schedule saved to Firestore successfully.');
            }

            setScheduleForm(defaultSchedule);
            setEditingScheduleId(null);
        } catch (error) {
            console.error('Error saving schedule:', error);
            setScheduleMessage('Failed to save schedule. Please try again.');
        }
    }

    function editSchedule(schedule: ScheduleRecord) {
        setScheduleForm({
            title: schedule.title,
            employeeName: schedule.employeeName,
            department: schedule.department,
            date: schedule.date,
            time: schedule.time,
            notes: schedule.notes,
        });
        setEditingScheduleId(schedule.id);
        setScheduleMessage('Editing selected schedule.');
    }

    async function deleteSchedule(scheduleId: string) {
        try {
            await deleteDoc(doc(db, 'schedules', scheduleId));
            if (editingScheduleId === scheduleId) {
                setEditingScheduleId(null);
                setScheduleForm(defaultSchedule);
            }
            setScheduleMessage('Schedule deleted from Firestore.');
        } catch (error) {
            console.error('Error deleting schedule:', error);
            setScheduleMessage('Failed to delete schedule.');
        }
    }

    function updateAttendanceDraft(scheduleId: string, value: string) {
        setAttendanceDrafts((current) => ({
            ...current,
            [scheduleId]: value,
        }));
    }

    function addAttendanceEntry(scheduleId: string) {
        const name = (attendanceDrafts[scheduleId] ?? '').trim();

        if (!name) {
            return;
        }

        const newEntry: AttendanceEntry = {
            id: `${scheduleId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            name,
            status: 'present',
        };

        setAttendanceRecords((current) => ({
            ...current,
            [scheduleId]: [...(current[scheduleId] ?? []), newEntry],
        }));

        setAttendanceDrafts((current) => ({
            ...current,
            [scheduleId]: '',
        }));
    }

    function updateAttendanceStatus(scheduleId: string, entryId: string, status: AttendanceStatus) {
        setAttendanceRecords((current) => ({
            ...current,
            [scheduleId]: (current[scheduleId] ?? []).map((entry) =>
                entry.id === entryId ? { ...entry, status } : entry,
            ),
        }));
    }

    function removeAttendanceEntry(scheduleId: string, entryId: string) {
        setAttendanceRecords((current) => ({
            ...current,
            [scheduleId]: (current[scheduleId] ?? []).filter((entry) => entry.id !== entryId),
        }));
    }

    function updateTimeEntry(scheduleId: string, field: keyof TimeEntry, value: string) {
        setTimeEntries((current) => ({
            ...current,
            [scheduleId]: {
                timeIn: current[scheduleId]?.timeIn ?? '',
                timeOut: current[scheduleId]?.timeOut ?? '',
                [field]: value,
            },
        }));
    }

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <section className="rounded-xl border bg-card p-4 shadow-sm">
                    <h1 className="text-xl font-semibold">Employees</h1>
                    <p className="text-sm text-muted-foreground">Add a new Employee</p>

                    <form onSubmit={submit} className="mt-4 max-w-xl space-y-3 rounded-xl border p-4">
                        <div className="space-y-2">
                            <label htmlFor="name">Name</label>
                            <Input
                                id="name"
                                value={form.data.name}
                                placeholder="Enter employee name"
                                onChange={(event) => form.setData('name', event.target.value)}
                            />
                            {form.errors.name && <p className="text-sm text-red-600">{form.errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email">Email</label>
                            <Input
                                id="email"
                                value={form.data.email}
                                placeholder="Enter work email"
                                onChange={(event) => form.setData('email', event.target.value)}
                            />
                            {form.errors.email && <p className="text-sm text-red-600">{form.errors.email}</p>}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="phone">Phone</label>
                            <Input
                                id="phone"
                                value={form.data.phone}
                                placeholder="Enter employee phone"
                                onChange={(event) => form.setData('phone', event.target.value)}
                            />
                            {form.errors.phone && <p className="text-sm text-red-600">{form.errors.phone}</p>}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="address">Address</label>
                            <Input
                                id="address"
                                value={form.data.address}
                                placeholder="Enter employee address"
                                onChange={(event) => form.setData('address', event.target.value)}
                            />
                            {form.errors.address && <p className="text-sm text-red-600">{form.errors.address}</p>}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="position">Position</label>
                            <Input
                                id="position"
                                value={form.data.position}
                                placeholder="Enter employee position"
                                onChange={(event) => form.setData('position', event.target.value)}
                            />
                            {form.errors.position && <p className="text-sm text-red-600">{form.errors.position}</p>}
                        </div>

                        <Button type="submit" disabled={form.processing}>Save Employee</Button>
                    </form>
                </section>

                <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr] xl:items-start">
                    <section className="rounded-xl border bg-card p-4 shadow-sm">
                        <h2 className="text-xl font-semibold">Schedule</h2>
                        <p className="text-sm text-muted-foreground">Create a new schedule entry in Firebase Firestore</p>

                        <form onSubmit={submitSchedule} className="mt-4 w-full space-y-3 rounded-xl border p-4">
                            <div className="space-y-2">
                                <label htmlFor="schedule-title">Schedule Title</label>
                                <Input
                                    id="schedule-title"
                                    value={scheduleForm.title}
                                    placeholder="Team standup"
                                    onChange={(event) => updateScheduleField('title', event.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="schedule-employee">Employee Name</label>
                                <Input
                                    id="schedule-employee"
                                    value={scheduleForm.employeeName}
                                    placeholder="Enter employee name"
                                    onChange={(event) => updateScheduleField('employeeName', event.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="schedule-department">Department</label>
                                <Input
                                    id="schedule-department"
                                    value={scheduleForm.department}
                                    placeholder="Operations"
                                    onChange={(event) => updateScheduleField('department', event.target.value)}
                                />
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label htmlFor="schedule-date">Date</label>
                                    <Input
                                        id="schedule-date"
                                        type="date"
                                        value={scheduleForm.date}
                                        onChange={(event) => updateScheduleField('date', event.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="schedule-time">Time</label>
                                    <Input
                                        id="schedule-time"
                                        type="time"
                                        value={scheduleForm.time}
                                        onChange={(event) => updateScheduleField('time', event.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="schedule-notes">Notes</label>
                                <textarea
                                    id="schedule-notes"
                                    value={scheduleForm.notes}
                                    placeholder="Add meeting notes or reminders"
                                    className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    onChange={(event) => updateScheduleField('notes', event.target.value)}
                                />
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button type="submit">{editingScheduleId ? 'Update Schedule' : 'Save Schedule to Firestore'}</Button>
                                {editingScheduleId && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setEditingScheduleId(null);
                                            setScheduleForm(defaultSchedule);
                                            setScheduleMessage('Schedule form reset.');
                                        }}
                                    >
                                        Cancel Edit
                                    </Button>
                                )}
                            </div>
                            {scheduleMessage && <p className="text-sm text-muted-foreground">{scheduleMessage}</p>}
                        </form>
                    </section>

                    <section className="rounded-xl border bg-card p-4 shadow-sm xl:max-w-[560px] xl:w-full">
                        <h2 className="text-xl font-semibold">Saved Schedules</h2>

                        {loadingSchedules ? (
                            <p className="mt-3 text-sm text-muted-foreground">Loading schedules...</p>
                        ) : schedules.length === 0 ? (
                            <p className="mt-3 text-sm text-muted-foreground">No schedules saved yet.</p>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {schedules.map((schedule) => {
                                    const createdAt =
                                        schedule.createdAt && typeof schedule.createdAt.toDate === 'function'
                                            ? schedule.createdAt.toDate()
                                            : new Date();

                                    return (
                                        <div key={schedule.id} className="rounded-lg border p-3">
                                            <div className="flex flex-col gap-3">
                                                <div>
                                                    <p className="text-base font-semibold">{schedule.title}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {schedule.employeeName} • {schedule.department}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {schedule.date} at {schedule.time}
                                                    </p>
                                                    {schedule.notes && (
                                                        <p className="mt-2 text-sm">{schedule.notes}</p>
                                                    )}
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button type="button" variant="outline" onClick={() => editSchedule(schedule)}>
                                                        Edit
                                                    </Button>
                                                    <Button type="button" variant="destructive" onClick={() => deleteSchedule(schedule.id)}>
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="mt-4 border-t pt-3">
                                                <p className="mb-2 text-sm font-medium">Attendance</p>

                                                <div className="flex gap-2">
                                                    <input
                                                        value={attendanceDrafts[schedule.id] ?? ''}
                                                        onChange={(event) => updateAttendanceDraft(schedule.id, event.target.value)}
                                                        placeholder="Add employee name"
                                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
                                                    />
                                                    <Button type="button" onClick={() => addAttendanceEntry(schedule.id)}>
                                                        Add
                                                    </Button>
                                                </div>

                                                <div className="mt-3 space-y-2">
                                                    {(attendanceRecords[schedule.id] ?? []).length === 0 ? (
                                                        <p className="text-xs text-muted-foreground">No attendance marked yet.</p>
                                                    ) : (
                                                        (attendanceRecords[schedule.id] ?? []).map((entry) => (
                                                            <div key={entry.id} className="flex items-center justify-between gap-2 rounded-md border p-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium">{entry.name}</span>
                                                                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                                                                        {entry.status}
                                                                    </span>
                                                                </div>

                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        type="button"
                                                                        variant={entry.status === 'present' ? 'default' : 'outline'}
                                                                        onClick={() => updateAttendanceStatus(schedule.id, entry.id, 'present')}
                                                                        className="h-8 px-2 text-xs"
                                                                    >
                                                                        Present
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant={entry.status === 'absent' ? 'destructive' : 'outline'}
                                                                        onClick={() => updateAttendanceStatus(schedule.id, entry.id, 'absent')}
                                                                        className="h-8 px-2 text-xs"
                                                                    >
                                                                        Absent
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        onClick={() => removeAttendanceEntry(schedule.id, entry.id)}
                                                                        className="h-8 px-2 text-xs"
                                                                    >
                                                                        Remove
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-4 border-t pt-3">
                                                <p className="mb-2 text-sm font-medium">Time In / Time Out</p>
                                                <div className="grid gap-3 md:grid-cols-2">
                                                    <div className="space-y-1">
                                                        <label htmlFor={`time-in-${schedule.id}`} className="text-xs text-muted-foreground">Time In</label>
                                                        <Input
                                                            id={`time-in-${schedule.id}`}
                                                            type="time"
                                                            value={timeEntries[schedule.id]?.timeIn ?? ''}
                                                            onChange={(event) => updateTimeEntry(schedule.id, 'timeIn', event.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label htmlFor={`time-out-${schedule.id}`} className="text-xs text-muted-foreground">Time Out</label>
                                                        <Input
                                                            id={`time-out-${schedule.id}`}
                                                            type="time"
                                                            value={timeEntries[schedule.id]?.timeOut ?? ''}
                                                            onChange={(event) => updateTimeEntry(schedule.id, 'timeOut', event.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="mt-3 text-xs text-muted-foreground">
                                                Created: {createdAt.toLocaleString()}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
