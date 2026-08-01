<?php

namespace App\Http\Controllers;

use App\Models\employee;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render ('daashboard', [' employees' => Employee::query()->latest()->get()
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    // public function create()
    // {
    //     //
    // }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request ->validate([
            'name'=> ['required', 'string', 'max:255'],
            'email'=> ['required', 'string', 'email', 'max:255', 'unique:employees'],
            'phone'=> ['required', 'numeric', 'digits:11'],
            'address'=> ['required', 'string', 'max:255'],
            'position'=> ['required', 'string', 'max:255'],

        ]);
        Employee::create($data);
        return redirect()-> route ('dashboard');
    }

    /**
     * Display the specified resource.
     */
    // public function show(employee $employee)
    // {
    //     //
    // }

    // /**
    //  * Show the form for editing the specified resource.
    //  */
    // public function edit(employee $employee)
    // {
    //     //
    // }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, employee $employee)
    {
        $data = $request ->validate([
            'name'=> ['required', 'string', 'max:255'],
            'email'=> ['required', 'string', 'email', 'max:255', 'unique:employees'],
            'phone'=> ['required', 'numeric', 'digits:11'],
            'address'=> ['required', 'string', 'max:255'],
            'position'=> ['required', 'string', 'max:255'],

        ]);
        $employee->update($data);
        return redirect()-> route ('dashboard');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(employee $employee)
    {
        $employee->delete();
        return redirect()-> route ('dashboard');
    }
}
