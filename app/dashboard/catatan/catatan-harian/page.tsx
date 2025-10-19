"use client";

import { useState, useEffect } from "react";
import {
  IconPlus,
  IconSearch,
  IconPin,
  IconPinFilled,
  IconTrash,
  IconEdit,
  IconCalendar,
  IconDots,
  IconFilter,
  IconSortDescending,
  IconX,
  IconLoader2,
  IconAlertCircle,
  IconGripVertical,
  IconClock,
  IconPalette,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { notesService, Note, CreateNoteData, UpdateNoteData } from "@/lib/api/notes";
import { format } from "date-fns";
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
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const colorOptions = [
  {
    name: "Default",
    value: "bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900",
    border: "border-slate-200/60 dark:border-slate-700/60",
    shadow: "shadow-slate-200/50 dark:shadow-slate-900/50",
    glow: "hover:shadow-slate-300/60 dark:hover:shadow-slate-700/60"
  },
  {
    name: "Yellow",
    value: "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-yellow-950/40 dark:via-amber-950/30 dark:to-orange-950/40",
    border: "border-amber-300/60 dark:border-amber-700/60",
    shadow: "shadow-amber-200/50 dark:shadow-amber-900/50",
    glow: "hover:shadow-amber-400/60 dark:hover:shadow-amber-600/60"
  },
  {
    name: "Blue",
    value: "bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 dark:from-blue-950/40 dark:via-cyan-950/30 dark:to-sky-950/40",
    border: "border-blue-300/60 dark:border-blue-700/60",
    shadow: "shadow-blue-200/50 dark:shadow-blue-900/50",
    glow: "hover:shadow-blue-400/60 dark:hover:shadow-blue-600/60"
  },
  {
    name: "Green",
    value: "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/40 dark:via-green-950/30 dark:to-teal-950/40",
    border: "border-emerald-300/60 dark:border-emerald-700/60",
    shadow: "shadow-emerald-200/50 dark:shadow-emerald-900/50",
    glow: "hover:shadow-emerald-400/60 dark:hover:shadow-emerald-600/60"
  },
  {
    name: "Pink",
    value: "bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 dark:from-pink-950/40 dark:via-rose-950/30 dark:to-fuchsia-950/40",
    border: "border-pink-300/60 dark:border-pink-700/60",
    shadow: "shadow-pink-200/50 dark:shadow-pink-900/50",
    glow: "hover:shadow-pink-400/60 dark:hover:shadow-pink-600/60"
  },
  {
    name: "Purple",
    value: "bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 dark:from-purple-950/40 dark:via-violet-950/30 dark:to-indigo-950/40",
    border: "border-purple-300/60 dark:border-purple-700/60",
    shadow: "shadow-purple-200/50 dark:shadow-purple-900/50",
    glow: "hover:shadow-purple-400/60 dark:hover:shadow-purple-600/60"
  },
];

export default function CatatanHarianPage() {
  // State management
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;

  // Sorting
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'title'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: "",
    is_favorite: false,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Drag and Drop states
  const [activeId, setActiveId] = useState<number | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load notes from backend
  const loadNotes = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await notesService.getNotes({
        search: searchQuery || undefined,
        tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
        is_favorite: showFavoritesOnly ? true : undefined,
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (response.success && response.data) {
        setNotes(response.data.notes || []);
        setTotal(response.data.total || 0);
        setTotalPages(response.data.total_pages || 1);
      } else {
        setError(response.message || "Failed to load notes");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Load notes on mount and when filters change
  useEffect(() => {
    loadNotes();
  }, [page, sortBy, sortOrder, showFavoritesOnly]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        loadNotes();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle create note
  const handleCreateNote = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setFormError("Title and content are required");
      return;
    }

    setFormLoading(true);
    setFormError("");

    try {
      const noteData: CreateNoteData = {
        title: formData.title,
        content: formData.content,
        tags: formData.tags || undefined,
        is_favorite: formData.is_favorite,
      };

      const response = await notesService.createNote(noteData);

      if (response.success) {
        setIsCreateDialogOpen(false);
        resetForm();
        loadNotes(); // Reload notes
      } else {
        setFormError(response.message || "Failed to create note");
      }
    } catch (err) {
      setFormError("An unexpected error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle update note
  const handleUpdateNote = async () => {
    if (!selectedNote || !formData.title.trim() || !formData.content.trim()) {
      setFormError("Title and content are required");
      return;
    }

    setFormLoading(true);
    setFormError("");

    try {
      const updateData: UpdateNoteData = {
        title: formData.title,
        content: formData.content,
        tags: formData.tags || undefined,
        is_favorite: formData.is_favorite,
      };

      const response = await notesService.updateNote(selectedNote.id, updateData);

      if (response.success) {
        setIsEditDialogOpen(false);
        setSelectedNote(null);
        resetForm();
        loadNotes(); // Reload notes
      } else {
        setFormError(response.message || "Failed to update note");
      }
    } catch (err) {
      setFormError("An unexpected error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete note
  const handleDeleteNote = async () => {
    if (!selectedNote) return;

    setFormLoading(true);

    try {
      const response = await notesService.deleteNote(selectedNote.id);

      if (response.success) {
        setIsDeleteDialogOpen(false);
        setSelectedNote(null);
        loadNotes(); // Reload notes
      } else {
        setFormError(response.message || "Failed to delete note");
      }
    } catch (err) {
      setFormError("An unexpected error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle toggle favorite
  const handleToggleFavorite = async (note: Note) => {
    try {
      const response = await notesService.toggleFavorite(note.id);

      if (response.success) {
        // Update local state immediately for better UX
        setNotes(notes.map(n =>
          n.id === note.id ? { ...n, is_favorite: !n.is_favorite } : n
        ));
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    if (active.id !== over.id) {
      const activeNote = notes.find((note) => note.id === active.id);
      const overNote = notes.find((note) => note.id === over.id);

      if (activeNote && overNote) {
        // If dragging between pinned/unpinned sections, toggle favorite
        if (activeNote.is_favorite !== overNote.is_favorite) {
          handleToggleFavorite(activeNote);
        } else {
          // Otherwise, just reorder
          const oldIndex = notes.findIndex((note) => note.id === active.id);
          const newIndex = notes.findIndex((note) => note.id === over.id);
          setNotes(arrayMove(notes, oldIndex, newIndex));
        }
      }
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Open edit dialog
  const openEditDialog = (note: Note) => {
    setSelectedNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      tags: note.tags || "",
      is_favorite: note.is_favorite,
    });
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (note: Note) => {
    setSelectedNote(note);
    setIsDeleteDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      tags: "",
      is_favorite: false,
    });
    setFormError("");
  };

  // Get all unique tags from notes
  const allTags = Array.from(
    new Set(
      notes
        .filter(note => note.tags)
        .flatMap(note => note.tags.split(',').map(tag => tag.trim()))
        .filter(tag => tag)
    )
  );

  // Split notes into pinned and unpinned
  const pinnedNotes = notes.filter(note => note.is_favorite);
  const unpinnedNotes = notes.filter(note => !note.is_favorite);

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Header with gradient background */}
      <div className="flex flex-col gap-4 p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border border-primary/10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Catatan Harian
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                {total}
              </span>
              catatan tersimpan
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
            className="gap-2 px-6 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary"
          >
            <IconPlus className="h-5 w-5" />
            Tambah Catatan
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Cari catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base border-2 focus:border-primary/50 transition-all duration-200"
            />
          </div>

          <div className="flex gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 h-12 px-5 border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                >
                  <IconFilter className="h-5 w-5" />
                  <span className="font-medium">Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className="flex items-center justify-between py-3"
                >
                  <span className="font-medium">Favorit Saja</span>
                  {showFavoritesOnly && <IconPin className="h-4 w-4 text-yellow-500" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 h-12 px-5 border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                >
                  <IconSortDescending className="h-5 w-5" />
                  <span className="font-medium">Urutkan</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => { setSortBy('created_at'); setSortOrder('desc'); }}>
                  Terbaru Dibuat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('created_at'); setSortOrder('asc'); }}>
                  Terlama Dibuat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('updated_at'); setSortOrder('desc'); }}>
                  Baru Diupdate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('title'); setSortOrder('asc'); }}>
                  Judul A-Z
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('title'); setSortOrder('desc'); }}>
                  Judul Z-A
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className={`cursor-pointer px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-110
                  ${selectedTags.includes(tag)
                    ? 'shadow-md hover:shadow-lg'
                    : 'hover:bg-primary/10 hover:border-primary/50'
                  }
                `}
                onClick={() => {
                  if (selectedTags.includes(tag)) {
                    setSelectedTags(selectedTags.filter(t => t !== tag));
                  } else {
                    setSelectedTags([...selectedTags, tag]);
                  }
                  setPage(1); // Reset to first page
                }}
              >
                {tag}
              </Badge>
            ))}
            {selectedTags.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTags([])}
                className="h-6 px-2"
              >
                <IconX className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <IconAlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-2">
            <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Memuat catatan...</p>
          </div>
        </div>
      ) : notes.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground">Belum ada catatan</p>
            <Button
              variant="link"
              onClick={() => {
                resetForm();
                setIsCreateDialogOpen(true);
              }}
            >
              Buat catatan pertama
            </Button>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {/* Pinned Notes */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 border border-yellow-500/20">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <IconPinFilled className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h2 className="text-base font-bold text-yellow-700 dark:text-yellow-300 uppercase tracking-wider">
                  Dipinned ({pinnedNotes.length})
                </h2>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-yellow-500/30 to-transparent" />
              </div>
              <SortableContext items={pinnedNotes.map(n => n.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pinnedNotes.map((note) => (
                    <SortableNoteCard
                      key={note.id}
                      note={note}
                      onToggleFavorite={() => handleToggleFavorite(note)}
                      onEdit={() => openEditDialog(note)}
                      onDelete={() => openDeleteDialog(note)}
                      onView={(note) => {
                        setSelectedNote(note);
                        setIsViewDialogOpen(true);
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          )}

          {/* Unpinned Notes */}
          {unpinnedNotes.length > 0 && (
            <div className="space-y-5">
              {pinnedNotes.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border border-primary/10">
                  <h2 className="text-base font-bold text-foreground/70 uppercase tracking-wider">
                    Lainnya ({unpinnedNotes.length})
                  </h2>
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-primary/20 to-transparent" />
                </div>
              )}
              <SortableContext items={unpinnedNotes.map(n => n.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {unpinnedNotes.map((note) => (
                    <SortableNoteCard
                      key={note.id}
                      note={note}
                      onToggleFavorite={() => handleToggleFavorite(note)}
                      onEdit={() => openEditDialog(note)}
                      onDelete={() => openDeleteDialog(note)}
                      onView={(note) => {
                        setSelectedNote(note);
                        setIsViewDialogOpen(true);
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          )}

          <DragOverlay>
            {activeId ? (
              <NoteCard
                note={notes.find((n) => n.id === activeId)!}
                onToggleFavorite={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
                onView={() => {}}
                isDragging
              />
            ) : null}
          </DragOverlay>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </DndContext>
      )}

      {/* Create Note Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Buat Catatan Baru</DialogTitle>
            <DialogDescription>
              Tambahkan catatan harian Anda di sini
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Judul</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Judul catatan..."
                disabled={formLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Isi Catatan</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Tulis catatan Anda di sini..."
                rows={8}
                disabled={formLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (pisahkan dengan koma)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="personal, work, ideas"
                disabled={formLoading}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_favorite"
                checked={formData.is_favorite}
                onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
                disabled={formLoading}
                className="rounded"
              />
              <Label htmlFor="is_favorite" className="cursor-pointer">
                Tandai sebagai favorit
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={formLoading}
            >
              Batal
            </Button>
            <Button onClick={handleCreateNote} disabled={formLoading}>
              {formLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Catatan</DialogTitle>
            <DialogDescription>
              Ubah catatan Anda di sini
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-title">Judul</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Judul catatan..."
                disabled={formLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content">Isi Catatan</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Tulis catatan Anda di sini..."
                rows={8}
                disabled={formLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags (pisahkan dengan koma)</Label>
              <Input
                id="edit-tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="personal, work, ideas"
                disabled={formLoading}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-is_favorite"
                checked={formData.is_favorite}
                onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
                disabled={formLoading}
                className="rounded"
              />
              <Label htmlFor="edit-is_favorite" className="cursor-pointer">
                Tandai sebagai favorit
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={formLoading}
            >
              Batal
            </Button>
            <Button onClick={handleUpdateNote} disabled={formLoading}>
              {formLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Catatan?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus catatan "{selectedNote?.title}"?
              Tindakan ini dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={formLoading}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteNote}
              disabled={formLoading}
            >
              {formLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Note Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedNote?.title}</DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-2 text-xs mt-2">
                <IconCalendar className="h-3 w-3" />
                <span>Dibuat: {selectedNote && format(new Date(selectedNote.created_at), 'dd MMM yyyy HH:mm')}</span>
                <IconClock className="h-3 w-3 ml-2" />
                <span>Update: {selectedNote && format(new Date(selectedNote.updated_at), 'dd MMM yyyy HH:mm')}</span>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{selectedNote?.content}</p>
            </div>

            {selectedNote?.tags && (
              <div className="flex flex-wrap gap-1 pt-2 border-t">
                {selectedNote.tags.split(',').map(t => t.trim()).filter(t => t).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Tutup
            </Button>
            <Button onClick={() => {
              if (selectedNote) {
                setIsViewDialogOpen(false);
                openEditDialog(selectedNote);
              }
            }}>
              <IconEdit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sortable Note Card Component
function SortableNoteCard({
  note,
  onToggleFavorite,
  onEdit,
  onDelete,
  onView,
}: {
  note: Note;
  onToggleFavorite: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onView: (note: Note) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <NoteCard
        note={note}
        onToggleFavorite={onToggleFavorite}
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}

// Note Card Component
function NoteCard({
  note,
  onToggleFavorite,
  onEdit,
  onDelete,
  onView,
  dragHandleProps,
  isDragging = false,
}: {
  note: Note;
  onToggleFavorite: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onView: (note: Note) => void;
  dragHandleProps?: any;
  isDragging?: boolean;
}) {
  const tags = note.tags ? note.tags.split(',').map(t => t.trim()).filter(t => t) : [];

  // Truncate content for preview
  const contentPreview = note.content.length > 200
    ? note.content.slice(0, 200) + "..."
    : note.content;

  // Get color config based on tags
  const colorConfig = colorOptions.find(c =>
    note.tags?.toLowerCase().includes(c.name.toLowerCase())
  ) || colorOptions[0];

  return (
    <Card
      className={`${colorConfig.value} group relative border-2 ${colorConfig.border}
        transition-all duration-300 cursor-pointer
        ${colorConfig.shadow} shadow-lg
        ${isDragging
          ? `shadow-2xl ${colorConfig.glow} scale-105 rotate-3 ring-2 ring-primary/50`
          : `hover:scale-[1.03] hover:-translate-y-1 ${colorConfig.glow} hover:shadow-2xl`
        }
        backdrop-blur-sm
        before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
      `}
      onClick={() => onView(note)}
    >
      <CardContent className="p-6 space-y-4 relative z-10">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Drag Handle and Header */}
        <div className="flex items-start gap-3">
          {dragHandleProps && (
            <button
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing touch-none p-2 hover:bg-primary/10 rounded-lg transition-all duration-200 mt-1 shrink-0 hover:scale-110"
              onClick={(e) => e.stopPropagation()}
            >
              <IconGripVertical className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="font-bold text-lg line-clamp-2 flex-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                {note.title}
              </h3>
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite();
                  }}
                >
                  {note.is_favorite ? (
                    <IconPinFilled className="h-5 w-5 text-yellow-500 drop-shadow-lg" />
                  ) : (
                    <IconPin className="h-5 w-5" />
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:bg-primary/10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconDots className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}>
                      <IconEdit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <IconTrash className="mr-2 h-4 w-4" />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Content Preview */}
            <p className="text-sm text-muted-foreground/90 line-clamp-4 mb-4 whitespace-pre-wrap leading-relaxed">
              {contentPreview}
            </p>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.slice(0, 3).map((tag, index) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className={`text-xs px-3 py-1 font-medium transition-all duration-200 hover:scale-110
                      ${index === 0 ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}
                      ${index === 1 ? 'bg-secondary/80 hover:bg-secondary' : ''}
                      ${index === 2 ? 'bg-muted hover:bg-muted/80' : ''}
                    `}
                  >
                    {tag}
                  </Badge>
                ))}
                {tags.length > 3 && (
                  <Badge
                    variant="outline"
                    className="text-xs px-3 py-1 font-medium bg-background/50 backdrop-blur-sm hover:bg-background transition-all duration-200"
                  >
                    +{tags.length - 3} lainnya
                  </Badge>
                )}
              </div>
            )}

            {/* Footer with date and update indicator */}
            <div className="flex items-center justify-between text-xs pt-4 border-t border-border/30">
              <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground/70 transition-colors">
                <div className="p-1.5 rounded-md bg-primary/5 group-hover:bg-primary/10 transition-colors">
                  <IconCalendar className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium">{format(new Date(note.created_at), 'dd MMM yyyy')}</span>
              </div>
              {note.created_at !== note.updated_at && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="p-1.5 rounded-md bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors">
                    <IconClock className="h-3.5 w-3.5 text-orange-500" />
                  </div>
                  <span className="font-medium text-orange-500/80">{format(new Date(note.updated_at), 'dd MMM')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
