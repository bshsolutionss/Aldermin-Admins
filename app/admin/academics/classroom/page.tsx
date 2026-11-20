"use client";

import React from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ClassRoomForm } from "@/components/modules/academics/ClassRoomForm";
import { Button } from "@/components/ui/button";
import { FaPlus } from "react-icons/fa";
import { DataTable } from "@/components/common/DataTable";
import { type Classroom as Room } from "@/lib/api-service";
import { useClassrooms } from "@/lib/use-classrooms";
import { ListActionButtons } from "@/components/common/ListActionButtons";

export default function ClassRoomPage() {
  const { rooms, isLoading, roomNumber, setRoomNumber, capacity, setCapacity, handleSubmit,
    error, saving, editingId, edit, remove, reset, reload } = useClassrooms();

  const columns = [
    {
      header: "Room Identifier",
      accessor: "roomNumber" as keyof Room,
      className: "font-bold text-foreground",
    },
    {
      header: "Seating Capacity",
      accessor: (item: Room) => (
        <span className="font-mono text-secondary font-bold">
          {item.capacity} Seats
        </span>
      ),
      className: "text-center",
      headerClassName: "text-center",
    },
    {
      header: "Action",
      accessor: (item: Room) => (
        <ListActionButtons
          onEdit={() => edit(item)}
          onDelete={() => void remove(item.id)}
        />
      ),
      className: "text-right",
      headerClassName: "text-right",
    },
  ];

  return (
    <div className="container mx-auto space-y-8 pb-10">
      {error && <p role="alert" className="text-sm text-red-600">{error} <button type="button" disabled={saving || isLoading} onClick={() => void reload()}>Retry</button></p>}
      <PageHeader
        title="Classroom Management"
        subtitle="Infrastructure"
        action={
          <Button disabled={saving} onClick={reset} className="bg-secondary hover:bg-secondary/90 text-white gap-2 py-6 px-6 rounded-xl font-bold text-[10px] shadow-lg shadow-secondary/10 transition-all">
            <FaPlus /> Add Room
          </Button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Creation Form */}
        <div className="xl:col-span-4 h-full sticky top-8">
          <ClassRoomForm
            disabled={saving || isLoading}
            editing={!!editingId}
            onCancel={reset}
            roomNumber={roomNumber}
            setRoomNumber={setRoomNumber}
            capacity={capacity}
            setCapacity={setCapacity}
            handleSubmit={handleSubmit}
          />
        </div>

        {/* List Index */}
        <div className="xl:col-span-8 h-full">
          <DataTable
            data={rooms}
            columns={columns}
            searchKey="roomNumber"
            searchPlaceholder="Search rooms..."
            title="Institutional Infrastructure"
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
