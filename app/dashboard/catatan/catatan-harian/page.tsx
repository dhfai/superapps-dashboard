"use client"

import { useState } from "react"
import {
  IconPlus,
  IconSearch,
  IconPin,
  IconPinFilled,
  IconTrash,
  IconEdit,
  IconCalendar,
  IconClock,
  IconPalette,
  IconDots,
  IconFilter,
  IconSortDescending,
  IconGripVertical,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface Note {
  id: number
  title: string
  content: string
  color: string
  isPinned: boolean
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

const colorOptions = [
  { name: "Default", value: "bg-card" },
  { name: "Yellow", value: "bg-yellow-50 dark:bg-yellow-950/20" },
  { name: "Blue", value: "bg-blue-50 dark:bg-blue-950/20" },
  { name: "Green", value: "bg-green-50 dark:bg-green-950/20" },
  { name: "Pink", value: "bg-pink-50 dark:bg-pink-950/20" },
  { name: "Purple", value: "bg-purple-50 dark:bg-purple-950/20" },
]

export default function CatatanHarianPage() {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: 1,
      title: "Meeting Notes",
      content: "Discussed Q4 goals and project timelines. Need to follow up with the design team about the new landing page.",
      color: "bg-yellow-50 dark:bg-yellow-950/20",
      isPinned: true,
      tags: ["work", "important"],
      createdAt: new Date(2024, 9, 15),
      updatedAt: new Date(2024, 9, 15),
    },
    {
      id: 2,
      title: "Shopping List",
      content: "Milk, Eggs, Bread, Coffee beans, Fresh vegetables, Chicken breast",
      color: "bg-blue-50 dark:bg-blue-950/20",
      isPinned: false,
      tags: ["personal"],
      createdAt: new Date(2024, 9, 14),
      updatedAt: new Date(2024, 9, 14),
    },
    {
      id: 3,
      title: "Book Ideas",
      content: "1. Time management techniques\n2. Productivity hacks for developers\n3. Building better habits\n\nThis is a longer note that will demonstrate the truncation feature. When content exceeds 250 characters, it will be automatically shortened with an ellipsis (...) to maintain consistent card heights across the grid. Users can click on the card to view the full content in a beautiful dialog modal. This approach ensures a clean, organized layout while still providing access to all information when needed.",
      color: "bg-green-50 dark:bg-green-950/20",
      isPinned: true,
      tags: ["ideas", "books", "productivity"],
      createdAt: new Date(2024, 9, 13),
      updatedAt: new Date(2024, 9, 13),
    },
  ])

  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [viewingNote, setViewingNote] = useState<Note | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    color: "bg-card",
    tags: [] as string[],
  })

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const pinnedNotes = filteredNotes.filter((note) => note.isPinned)
  const unpinnedNotes = filteredNotes.filter((note) => !note.isPinned)

  // Drag and Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const activeNote = notes.find((n) => n.id === active.id)
    const overNote = notes.find((n) => n.id === over.id)

    if (!activeNote) {
      setActiveId(null)
      return
    }

    // Check if dragging between different sections (pin/unpin)
    if (overNote && activeNote.isPinned !== overNote.isPinned) {
      // Toggle pin status when dragging to different section
      setNotes((items) => {
        return items.map((item) =>
          item.id === activeNote.id
            ? { ...item, isPinned: !item.isPinned }
            : item
        )
      })
    } else if (active.id !== over.id && overNote) {
      // Reorder within the same section
      setNotes((items) => {
        const oldIndex = items.findIndex((n) => n.id === active.id)
        const newIndex = items.findIndex((n) => n.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }

    setActiveId(null)
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const handleCreateNote = () => {
    if (newNote.title.trim() || newNote.content.trim()) {
      const note: Note = {
        id: Date.now(),
        title: newNote.title,
        content: newNote.content,
        color: newNote.color,
        isPinned: false,
        tags: newNote.tags,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setNotes([note, ...notes])
      setNewNote({ title: "", content: "", color: "bg-card", tags: [] })
      setIsDialogOpen(false)
    }
  }

  const handleUpdateNote = () => {
    if (editingNote) {
      setNotes(
        notes.map((note) =>
          note.id === editingNote.id
            ? { ...editingNote, updatedAt: new Date() }
            : note
        )
      )
      setEditingNote(null)
      setIsDialogOpen(false)
    }
  }

  const togglePin = (id: number) => {
    setNotes(
      notes.map((note) =>
        note.id === id ? { ...note, isPinned: !note.isPinned } : note
      )
    )
  }

  const deleteNote = (id: number) => {
    setNotes(notes.filter((note) => note.id !== id))
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date)
  }

  // Sortable Note Card Component
  const SortableNoteCard = ({ note }: { note: Note }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
      isOver,
    } = useSortable({ id: note.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    // Visual feedback for different section drop
    const activeNote = notes.find((n) => n.id === activeId)
    const isDropTarget =
      isOver && activeNote && activeNote.isPinned !== note.isPinned

    // Truncate content preview to 250 characters
    const contentPreview =
      note.content.length > 250
        ? note.content.slice(0, 250) + "..."
        : note.content

    return (
      <div ref={setNodeRef} style={style}>
        <Card
          className={`${note.color} relative border transition-all duration-200 cursor-pointer ${
            isDragging ? "shadow-xl scale-[1.02] opacity-50" : "shadow-sm hover:shadow-md"
          } ${
            isDropTarget
              ? "ring-2 ring-primary border-primary"
              : "border-border/50 hover:border-border"
          }`}
          onClick={() => {
            setViewingNote(note)
            setIsViewDialogOpen(true)
          }}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  className="cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-muted rounded-md transition-colors shrink-0"
                  {...attributes}
                  {...listeners}
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconGripVertical className="h-4 w-4 text-muted-foreground" />
                </button>
                <h3 className="font-semibold text-lg line-clamp-1 flex-1">
                  {note.title || "Untitled Note"}
                </h3>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconDots className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingNote(note)
                      setIsDialogOpen(true)
                    }}
                    className="cursor-pointer"
                  >
                    <IconEdit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePin(note.id)
                    }}
                    className="cursor-pointer"
                  >
                    <IconPin className="h-4 w-4 mr-2" />
                    {note.isPinned ? "Unpin" : "Pin"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNote(note.id)
                    }}
                  >
                    <IconTrash className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-3 mb-4 min-h-[3.75rem]">
              {contentPreview}
            </p>

            <div className="flex items-center justify-between gap-2 pt-3 border-t">
              <div className="flex flex-wrap gap-1.5">
                {note.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs font-normal"
                  >
                    {tag}
                  </Badge>
                ))}
                {note.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{note.tags.length - 3}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <IconClock className="h-3 w-3" />
                <span>{formatDate(note.updatedAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const NoteCard = ({ note }: { note: Note }) => {
    const contentPreview =
      note.content.length > 250
        ? note.content.slice(0, 250) + "..."
        : note.content

    return (
      <Card
        className={`${note.color} relative border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md border-border/50 hover:border-border`}
      >
        <CardContent className="p-5">
          <h3 className="font-semibold text-lg line-clamp-1 mb-3">
            {note.title || "Untitled Note"}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 min-h-[3.75rem]">
            {contentPreview}
          </p>

          <div className="flex items-center justify-between gap-2 pt-3 border-t">
            <div className="flex flex-wrap gap-1.5">
              {note.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  {tag}
                </Badge>
              ))}
              {note.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{note.tags.length - 3}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <IconClock className="h-3 w-3" />
              <span>{formatDate(note.updatedAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* View Note Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold pr-8">
              {viewingNote?.title || "Untitled Note"}
            </DialogTitle>
            {viewingNote?.tags && viewingNote.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {viewingNote.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </DialogHeader>

          {viewingNote && (
            <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-200px)] pr-2">
              <div className={`${viewingNote.color} p-6 rounded-lg border`}>
                <p className="text-base whitespace-pre-wrap leading-relaxed">
                  {viewingNote.content}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t text-sm">
                <div className="space-y-1 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <IconCalendar className="h-4 w-4" />
                    <span>Dibuat: {formatDate(viewingNote.createdAt)}</span>
                  </div>
                  {viewingNote.createdAt !== viewingNote.updatedAt && (
                    <div className="flex items-center gap-2">
                      <IconEdit className="h-4 w-4" />
                      <span>Diubah: {formatDate(viewingNote.updatedAt)}</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteNote(viewingNote.id)
                    setIsViewDialogOpen(false)
                  }}
                >
                  <IconTrash className="h-4 w-4 mr-2" />
                  Hapus
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">Catatan Harian</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {notes.length} catatan tersimpan
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingNote(null)
                  setNewNote({ title: "", content: "", color: "bg-card", tags: [] })
                }}
              >
                <IconPlus className="h-4 w-4 mr-2" />
                Catatan Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  {editingNote ? "Edit Catatan" : "Buat Catatan Baru"}
                </DialogTitle>
                <DialogDescription>
                  {editingNote
                    ? "Edit catatan Anda di bawah ini"
                    : "Buat catatan baru untuk menyimpan ide dan pemikiran Anda"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul Catatan</Label>
                  <Input
                    id="title"
                    placeholder="Masukkan judul catatan..."
                    value={editingNote ? editingNote.title : newNote.title}
                    onChange={(e) =>
                      editingNote
                        ? setEditingNote({ ...editingNote, title: e.target.value })
                        : setNewNote({ ...newNote, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Isi Catatan</Label>
                  <Textarea
                    id="content"
                    placeholder="Tulis catatan Anda di sini..."
                    className="min-h-[200px] resize-none"
                    rows={8}
                    value={editingNote ? editingNote.content : newNote.content}
                    onChange={(e) =>
                      editingNote
                        ? setEditingNote({ ...editingNote, content: e.target.value })
                        : setNewNote({ ...newNote, content: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <IconPalette className="h-4 w-4" />
                    Warna Kartu
                  </Label>
                  <div className="grid grid-cols-6 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() =>
                          editingNote
                            ? setEditingNote({ ...editingNote, color: color.value })
                            : setNewNote({ ...newNote, color: color.value })
                        }
                        className={`h-10 rounded-md border-2 transition-all ${color.value} ${
                          (editingNote?.color || newNote.color) === color.value
                            ? "border-primary ring-2 ring-primary/20 scale-110"
                            : "border-muted hover:border-primary/50"
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false)
                      setEditingNote(null)
                    }}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={editingNote ? handleUpdateNote : handleCreateNote}
                    className="flex-1"
                  >
                    {editingNote ? "Simpan Perubahan" : "Buat Catatan"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Search and Filter Bar */}
      <div className="border-b bg-muted/20 px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari catatan..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <IconFilter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <IconSortDescending className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="flex-1 overflow-auto px-6 py-6">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-muted/30 rounded-full p-6 mb-4">
              <IconCalendar className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery
                ? "Tidak ada catatan ditemukan"
                : "Belum ada catatan"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? "Coba kata kunci yang berbeda"
                : "Mulai buat catatan pertama Anda"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <IconPlus className="h-4 w-4 mr-2" />
                Buat Catatan Pertama
              </Button>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="space-y-6">
              {/* Pinned Notes */}
              {pinnedNotes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <IconPinFilled className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Disematkan
                    </h2>
                  </div>
                  <SortableContext
                    items={pinnedNotes.map((n) => n.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {pinnedNotes.map((note) => (
                        <SortableNoteCard key={note.id} note={note} />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              )}

              {/* Other Notes */}
              {unpinnedNotes.length > 0 && (
                <div className="space-y-3">
                  {pinnedNotes.length > 0 && (
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Lainnya
                    </h2>
                  )}
                  <SortableContext
                    items={unpinnedNotes.map((n) => n.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {unpinnedNotes.map((note) => (
                        <SortableNoteCard key={note.id} note={note} />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              )}
            </div>

            <DragOverlay>
              {activeId ? (
                <NoteCard note={notes.find((n) => n.id === activeId)!} />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  )
}
