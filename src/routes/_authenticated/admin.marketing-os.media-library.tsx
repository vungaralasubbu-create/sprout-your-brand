import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  listMediaFolders,
  saveMediaFolder,
  listMediaAssets,
  getMediaDashboard,
  createMediaUploadUrl,
  registerMediaAsset,
  getMediaSignedUrls,
  updateMediaAsset,
  bulkMediaAction,
  toggleMediaFavorite,
  listMediaFavorites,
  listMediaCollections,
  saveMediaCollection,
  addToCollection,
  aiTagMediaAsset,
  listMediaUsage,
} from "@/lib/marketing-os/media-library.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FolderOpen,
  Folder,
  Upload,
  Grid3x3,
  List,
  Image as ImageIcon,
  Video,
  FileText,
  Sparkles,
  Star,
  Trash2,
  Archive,
  Search,
  Plus,
  MoreHorizontal,
  Layers,
  Tag,
  HardDrive,
  Film,
  Palette as PaletteIcon,
  Megaphone,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/marketing-os/media-library")({
  component: MediaLibrary,
});

const KIND_ICONS: Record<string, any> = {
  image: ImageIcon,
  video: Video,
  document: FileText,
  audio: Film,
  archive: HardDrive,
  data: FileText,
  other: FileText,
};

function formatBytes(n: number) {
  if (!n) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
}

function MediaLibrary() {
  const qc = useQueryClient();
  const folderFn = useServerFn(listMediaFolders);
  const dashFn = useServerFn(getMediaDashboard);
  const listFn = useServerFn(listMediaAssets);
  const uploadUrlFn = useServerFn(createMediaUploadUrl);
  const registerFn = useServerFn(registerMediaAsset);
  const signedFn = useServerFn(getMediaSignedUrls);
  const updateFn = useServerFn(updateMediaAsset);
  const bulkFn = useServerFn(bulkMediaAction);
  const favFn = useServerFn(toggleMediaFavorite);
  const favListFn = useServerFn(listMediaFavorites);
  const collFn = useServerFn(listMediaCollections);
  const saveCollFn = useServerFn(saveMediaCollection);
  const addCollFn = useServerFn(addToCollection);
  const aiTagFn = useServerFn(aiTagMediaAsset);
  const saveFolderFn = useServerFn(saveMediaFolder);

  const [folderId, setFolderId] = useState<string | "all" | "unfiled">("all");
  const [kind, setKind] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [archived, setArchived] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);

  const dashboard = useQuery({ queryKey: ["media-dash"], queryFn: () => dashFn() });
  const folders = useQuery({ queryKey: ["media-folders"], queryFn: () => folderFn() });
  const favorites = useQuery({ queryKey: ["media-favorites"], queryFn: () => favListFn() });
  const collections = useQuery({ queryKey: ["media-collections"], queryFn: () => collFn() });

  const listQuery = useQuery({
    queryKey: ["media-assets", { folderId, kind, source, search, favoritesOnly, archived, deleted }],
    queryFn: () =>
      listFn({
        data: {
          folder_id: folderId === "all" ? undefined : folderId === "unfiled" ? null : folderId,
          kind: kind === "all" ? undefined : kind,
          source: source === "all" ? undefined : source,
          search: search || undefined,
          favorites_only: favoritesOnly,
          archived,
          deleted,
        },
      }),
  });

  const assets = listQuery.data?.assets ?? [];

  // Fetch signed URLs (batched)
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    const need = assets.filter((a: any) => !urls[a.id]).map((a: any) => a.id).slice(0, 60);
    if (!need.length) return;
    signedFn({ data: { ids: need } }).then((r) => setUrls((u) => ({ ...u, ...r.urls })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets]);

  const favSet = useMemo(() => new Set(favorites.data?.ids ?? []), [favorites.data]);

  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const clearSelection = () => setSelected(new Set());

  // Mutations
  const favMut = useMutation({
    mutationFn: async (id: string) => favFn({ data: { asset_id: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["media-favorites"] }),
  });

  const bulkMut = useMutation({
    mutationFn: async (v: { action: any; folder_id?: string | null }) => bulkFn({ data: { ids: Array.from(selected), ...v } }),
    onSuccess: () => {
      toast.success("Applied");
      clearSelection();
      qc.invalidateQueries({ queryKey: ["media-assets"] });
      qc.invalidateQueries({ queryKey: ["media-dash"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const aiTagMut = useMutation({
    mutationFn: async (id: string) => aiTagFn({ data: { asset_id: id } }),
    onSuccess: () => {
      toast.success("AI tags generated");
      qc.invalidateQueries({ queryKey: ["media-assets"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "AI tagging failed"),
  });

  const uploadHandler = async (files: File[]) => {
    for (const file of files) {
      try {
        const target = folderId !== "all" && folderId !== "unfiled" ? folderId : null;
        const signed = await uploadUrlFn({ data: { file_name: file.name, mime_type: file.type, folder_id: target } });
        const { error: upErr } = await supabase.storage.from("media-library").uploadToSignedUrl(signed.path, signed.token, file, {
          contentType: file.type,
        });
        if (upErr) throw upErr;

        let width: number | undefined;
        let height: number | undefined;
        if (file.type.startsWith("image/")) {
          try {
            const url = URL.createObjectURL(file);
            const dim = await new Promise<{ w: number; h: number }>((res) => {
              const img = new Image();
              img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
              img.onerror = () => res({ w: 0, h: 0 });
              img.src = url;
            });
            width = dim.w || undefined;
            height = dim.h || undefined;
            URL.revokeObjectURL(url);
          } catch {}
        }

        await registerFn({
          data: {
            folder_id: target,
            storage_path: signed.path,
            file_name: file.name,
            original_name: file.name,
            mime_type: file.type,
            size_bytes: file.size,
            width,
            height,
          },
        });
        toast.success(`Uploaded ${file.name}`);
      } catch (e: any) {
        toast.error(`${file.name}: ${e?.message ?? "upload failed"}`);
      }
    }
    qc.invalidateQueries({ queryKey: ["media-assets"] });
    qc.invalidateQueries({ queryKey: ["media-dash"] });
  };

  const t = dashboard.data?.totals;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary">Marketing OS</div>
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <FolderOpen className="size-6 text-primary" /> Media Library
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Every image, video, document and AI asset — organized, versioned, searchable.</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={collectionOpen} onOpenChange={setCollectionOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Layers className="size-4 mr-1.5" /> Collections
              </Button>
            </DialogTrigger>
            <CollectionsDialog
              collections={collections.data?.collections ?? []}
              onCreate={async (name) => {
                await saveCollFn({ data: { name } });
                qc.invalidateQueries({ queryKey: ["media-collections"] });
              }}
              onAdd={async (id) => {
                if (!selected.size) {
                  toast.error("Select assets first");
                  return;
                }
                await addCollFn({ data: { collection_id: id, asset_ids: Array.from(selected) } });
                toast.success("Added to collection");
                setCollectionOpen(false);
              }}
            />
          </Dialog>

          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="size-4 mr-1.5" /> Upload
              </Button>
            </DialogTrigger>
            <UploadDialog onUpload={uploadHandler} onDone={() => setUploadOpen(false)} />
          </Dialog>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <Kpi icon={HardDrive} label="Total Assets" value={(t?.total ?? 0).toLocaleString()} />
        <Kpi icon={HardDrive} label="Storage" value={formatBytes(t?.bytes ?? 0)} />
        <Kpi icon={Sparkles} label="AI Assets" value={t?.ai ?? 0} />
        <Kpi icon={Video} label="Videos" value={t?.videos ?? 0} />
        <Kpi icon={ImageIcon} label="Images" value={t?.images ?? 0} />
        <Kpi icon={FileText} label="Documents" value={t?.documents ?? 0} />
        <Kpi icon={PaletteIcon} label="Brand Assets" value={t?.brand ?? 0} />
        <Kpi icon={Megaphone} label="Campaign Assets" value={t?.campaign ?? 0} />
        <Kpi icon={Tag} label="Unused" value={t?.unused ?? 0} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
        {/* Sidebar */}
        <Card className="p-3 h-fit sticky top-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Folders</span>
            <button className="text-primary hover:opacity-80" onClick={() => setNewFolderOpen(true)} title="New folder">
              <Plus className="size-4" />
            </button>
          </div>
          <div className="space-y-0.5 text-sm">
            <FolderRow label="All Assets" icon={FolderOpen} active={folderId === "all"} onClick={() => setFolderId("all")} />
            <FolderRow label="Unfiled" icon={Folder} active={folderId === "unfiled"} onClick={() => setFolderId("unfiled")} />
            {(folders.data?.folders ?? []).map((f: any) => (
              <FolderRow key={f.id} label={f.name} icon={Folder} active={folderId === f.id} onClick={() => setFolderId(f.id)} />
            ))}
          </div>

          <div className="mt-4 space-y-0.5 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Filters</div>
            <FolderRow label="Favorites" icon={Star} active={favoritesOnly} onClick={() => setFavoritesOnly((v) => !v)} />
            <FolderRow label="AI Generated" icon={Sparkles} active={source === "ai_generated"} onClick={() => setSource(source === "ai_generated" ? "all" : "ai_generated")} />
            <FolderRow label="Archived" icon={Archive} active={archived} onClick={() => { setArchived((v) => !v); setDeleted(false); }} />
            <FolderRow label="Recycle Bin" icon={Trash2} active={deleted} onClick={() => { setDeleted((v) => !v); setArchived(false); }} />
          </div>
        </Card>

        {/* Content */}
        <div className="space-y-3">
          {/* Toolbar */}
          <Card className="p-3 flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="size-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input placeholder="Search filename, title, alt text, description..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="archive">Archive</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border rounded-md">
              <button onClick={() => setView("grid")} className={cn("p-2", view === "grid" && "bg-accent")}>
                <Grid3x3 className="size-4" />
              </button>
              <button onClick={() => setView("list")} className={cn("p-2", view === "list" && "bg-accent")}>
                <List className="size-4" />
              </button>
            </div>
          </Card>

          {/* Selection bar */}
          {selected.size > 0 && (
            <Card className="p-2 flex items-center gap-2 flex-wrap bg-primary/5 border-primary/30">
              <span className="text-sm font-medium ml-1">{selected.size} selected</span>
              <div className="flex-1" />
              <Button size="sm" variant="outline" onClick={() => bulkMut.mutate({ action: "archive" })}>
                <Archive className="size-3.5 mr-1" /> Archive
              </Button>
              {deleted ? (
                <Button size="sm" variant="outline" onClick={() => bulkMut.mutate({ action: "restore" })}>
                  <RefreshCw className="size-3.5 mr-1" /> Restore
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => bulkMut.mutate({ action: "trash" })}>
                  <Trash2 className="size-3.5 mr-1" /> Trash
                </Button>
              )}
              {deleted && (
                <Button size="sm" variant="outline" onClick={() => bulkMut.mutate({ action: "delete" })}>
                  <Trash2 className="size-3.5 mr-1" /> Delete forever
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={clearSelection}>
                <X className="size-3.5" />
              </Button>
            </Card>
          )}

          {/* Assets */}
          {listQuery.isLoading && <div className="text-sm text-muted-foreground p-8">Loading assets…</div>}
          {!listQuery.isLoading && assets.length === 0 && (
            <Card className="p-10 text-center">
              <FolderOpen className="size-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm font-medium">No assets here yet</p>
              <p className="text-xs text-muted-foreground mt-1">Drag files, click Upload, or generate assets from any AI module.</p>
            </Card>
          )}

          {view === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {assets.map((a: any) => (
                <AssetCard
                  key={a.id}
                  asset={a}
                  url={urls[a.id]}
                  favorite={favSet.has(a.id)}
                  selected={selected.has(a.id)}
                  onToggleSelect={() => toggleSelect(a.id)}
                  onFavorite={() => favMut.mutate(a.id)}
                  onOpen={() => setDetailId(a.id)}
                />
              ))}
            </div>
          ) : (
            <Card className="divide-y">
              {assets.map((a: any) => (
                <AssetRow
                  key={a.id}
                  asset={a}
                  url={urls[a.id]}
                  favorite={favSet.has(a.id)}
                  selected={selected.has(a.id)}
                  onToggleSelect={() => toggleSelect(a.id)}
                  onFavorite={() => favMut.mutate(a.id)}
                  onOpen={() => setDetailId(a.id)}
                />
              ))}
            </Card>
          )}
        </div>
      </div>

      {/* Detail dialog */}
      {detailId && (
        <AssetDetailDialog
          assetId={detailId}
          asset={assets.find((a: any) => a.id === detailId)}
          url={urls[detailId]}
          onClose={() => setDetailId(null)}
          onSave={async (patch) => {
            await updateFn({ data: { id: detailId, ...patch } });
            qc.invalidateQueries({ queryKey: ["media-assets"] });
          }}
          onAiTag={() => aiTagMut.mutate(detailId)}
        />
      )}

      {/* New folder dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <NewFolderDialog
          onCreate={async (name) => {
            await saveFolderFn({ data: { name } });
            qc.invalidateQueries({ queryKey: ["media-folders"] });
            setNewFolderOpen(false);
          }}
        />
      </Dialog>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <Card className="p-2.5">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="text-lg font-semibold tracking-tight mt-0.5">{value}</div>
    </Card>
  );
}

function FolderRow({ label, icon: Icon, active, onClick }: { label: string; icon: any; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors",
        active ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent",
      )}
    >
      <Icon className="size-3.5" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function AssetCard({
  asset,
  url,
  favorite,
  selected,
  onToggleSelect,
  onFavorite,
  onOpen,
}: {
  asset: any;
  url?: string;
  favorite: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onFavorite: () => void;
  onOpen: () => void;
}) {
  const Icon = KIND_ICONS[asset.kind] ?? FileText;
  return (
    <Card className={cn("group overflow-hidden cursor-pointer hover:shadow-md transition-all", selected && "ring-2 ring-primary")}>
      <div className="aspect-square bg-muted relative" onClick={onOpen}>
        {url && asset.kind === "image" ? (
          <img src={url} alt={asset.alt_text ?? asset.file_name} className="w-full h-full object-cover" loading="lazy" />
        ) : url && asset.kind === "video" ? (
          <video src={url} className="w-full h-full object-cover" muted playsInline />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="size-10 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute top-1.5 left-1.5 flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
            className={cn(
              "size-5 rounded border-2 flex items-center justify-center transition-all",
              selected ? "bg-primary border-primary text-primary-foreground" : "bg-background/80 border-border opacity-0 group-hover:opacity-100",
            )}
          >
            {selected && <span className="text-[10px]">✓</span>}
          </button>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onFavorite(); }}
          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 hover:opacity-100"
        >
          <Star className={cn("size-4 drop-shadow", favorite ? "fill-yellow-400 text-yellow-400 opacity-100" : "text-white")} />
        </button>
        {asset.ai_generated && (
          <Badge variant="primary" size="sm" className="absolute bottom-1.5 left-1.5">
            <Sparkles className="size-2.5" /> AI
          </Badge>
        )}
      </div>
      <div className="p-2">
        <div className="text-xs font-medium truncate">{asset.title ?? asset.file_name}</div>
        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
          <Icon className="size-3" />
          {formatBytes(asset.size_bytes ?? 0)}
          {asset.width && asset.height && <span>· {asset.width}×{asset.height}</span>}
        </div>
      </div>
    </Card>
  );
}

function AssetRow({
  asset,
  url,
  favorite,
  selected,
  onToggleSelect,
  onFavorite,
  onOpen,
}: {
  asset: any;
  url?: string;
  favorite: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onFavorite: () => void;
  onOpen: () => void;
}) {
  const Icon = KIND_ICONS[asset.kind] ?? FileText;
  return (
    <div className={cn("flex items-center gap-3 px-3 py-2 hover:bg-accent/40 cursor-pointer", selected && "bg-primary/5")} onClick={onOpen}>
      <button onClick={(e) => { e.stopPropagation(); onToggleSelect(); }} className="size-4 rounded border flex items-center justify-center">
        {selected && <span className="text-[10px]">✓</span>}
      </button>
      <div className="size-10 rounded bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
        {url && asset.kind === "image" ? (
          <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <Icon className="size-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{asset.title ?? asset.file_name}</div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-2">
          <span className="capitalize">{asset.kind}</span>
          <span>·</span>
          <span>{formatBytes(asset.size_bytes ?? 0)}</span>
          {asset.width && asset.height && <><span>·</span><span>{asset.width}×{asset.height}</span></>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {asset.ai_generated && <Badge variant="primary" size="sm"><Sparkles className="size-2.5" /> AI</Badge>}
        <button onClick={(e) => { e.stopPropagation(); onFavorite(); }}>
          <Star className={cn("size-4", favorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
        </button>
      </div>
    </div>
  );
}

function UploadDialog({ onUpload, onDone }: { onUpload: (f: File[]) => Promise<void>; onDone: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setBusy(true);
    await onUpload(Array.from(files));
    setBusy(false);
    onDone();
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Upload to Media Library</DialogTitle>
      </DialogHeader>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border",
        )}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files); }}
      >
        <Upload className="size-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-medium">Drag files here</p>
        <p className="text-xs text-muted-foreground mt-1">Images, videos, PDFs, Office files, ZIP up to 50MB each</p>
        <Button className="mt-3" variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? "Uploading…" : "Or browse files"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handle(e.target.files)}
          accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/json,application/zip"
        />
      </div>
    </DialogContent>
  );
}

function CollectionsDialog({
  collections,
  onCreate,
  onAdd,
}: {
  collections: any[];
  onCreate: (name: string) => Promise<void>;
  onAdd: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Collections</DialogTitle>
      </DialogHeader>
      <div className="flex items-center gap-2">
        <Input placeholder="New collection name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button onClick={async () => { if (name) { await onCreate(name); setName(""); } }}>
          <Plus className="size-4 mr-1" /> Create
        </Button>
      </div>
      <div className="max-h-72 overflow-auto space-y-1">
        {collections.map((c: any) => (
          <div key={c.id} className="flex items-center justify-between border rounded p-2">
            <div>
              <div className="text-sm font-medium">{c.name}</div>
              <div className="text-[11px] text-muted-foreground">{c.kind}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => onAdd(c.id)}>
              Add selected
            </Button>
          </div>
        ))}
        {collections.length === 0 && <p className="text-xs text-muted-foreground text-center p-4">No collections yet.</p>}
      </div>
    </DialogContent>
  );
}

function NewFolderDialog({ onCreate }: { onCreate: (name: string) => Promise<void> }) {
  const [name, setName] = useState("");
  return (
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>New folder</DialogTitle>
      </DialogHeader>
      <Input placeholder="Folder name" value={name} onChange={(e) => setName(e.target.value)} />
      <DialogFooter>
        <Button disabled={!name} onClick={() => onCreate(name)}>Create</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function AssetDetailDialog({
  assetId,
  asset,
  url,
  onClose,
  onSave,
  onAiTag,
}: {
  assetId: string;
  asset: any;
  url?: string;
  onClose: () => void;
  onSave: (patch: any) => Promise<void>;
  onAiTag: () => void;
}) {
  const usageFn = useServerFn(listMediaUsage);
  const usage = useQuery({ queryKey: ["media-usage", assetId], queryFn: () => usageFn({ data: { asset_id: assetId } }) });
  const [form, setForm] = useState<any>({
    title: asset?.title ?? "",
    description: asset?.description ?? "",
    alt_text: asset?.alt_text ?? "",
    caption: asset?.caption ?? "",
    tags: (asset?.tags ?? []).join(", "),
    keywords: (asset?.keywords ?? []).join(", "),
  });

  if (!asset) return null;
  const Icon = KIND_ICONS[asset.kind] ?? FileText;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="truncate">{asset.title ?? asset.file_name}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted rounded aspect-square overflow-hidden flex items-center justify-center">
            {url && asset.kind === "image" ? (
              <img src={url} alt={asset.alt_text ?? ""} className="w-full h-full object-contain" />
            ) : url && asset.kind === "video" ? (
              <video src={url} controls className="w-full h-full" />
            ) : url && asset.kind === "document" ? (
              <iframe src={url} className="w-full h-full" title="Document preview" />
            ) : (
              <Icon className="size-16 text-muted-foreground/40" />
            )}
          </div>
          <div>
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="usage">Usage</TabsTrigger>
                <TabsTrigger value="ai">AI</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-2">
                <div>
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label>Alt text</Label>
                  <Input value={form.alt_text} onChange={(e) => setForm({ ...form, alt_text: e.target.value })} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <Label>Tags (comma-separated)</Label>
                  <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                </div>
                {asset.ai_tags?.length > 0 && (
                  <div>
                    <Label>AI tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {asset.ai_tags.map((t: string) => (
                        <Badge key={t} variant="primary" size="sm">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <div>Type: <span className="text-foreground">{asset.mime_type ?? asset.kind}</span></div>
                  <div>Size: <span className="text-foreground">{formatBytes(asset.size_bytes ?? 0)}</span></div>
                  {asset.width && <div>Dimensions: <span className="text-foreground">{asset.width}×{asset.height}</span></div>}
                  <div>Version: <span className="text-foreground">v{asset.current_version}</span></div>
                  <div>Uploaded: <span className="text-foreground">{new Date(asset.created_at).toLocaleDateString()}</span></div>
                </div>
              </TabsContent>
              <TabsContent value="usage">
                <div className="text-xs space-y-1.5">
                  {(usage.data?.usage ?? []).length === 0 && <p className="text-muted-foreground">Not used anywhere yet.</p>}
                  {(usage.data?.usage ?? []).map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between border rounded p-2">
                      <div>
                        <div className="font-medium capitalize">{u.usage_type}</div>
                        <div className="text-muted-foreground">{u.ref_table} · {new Date(u.created_at).toLocaleDateString()}</div>
                      </div>
                      {u.ref_url && (
                        <a href={u.ref_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          Open
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="ai">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Auto-detect topics, colors and content. Uses the central AI Router (never OpenAI direct).
                  </p>
                  <Button onClick={onAiTag}>
                    <Sparkles className="size-4 mr-1.5" /> Generate AI tags & alt text
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button
            onClick={async () => {
              await onSave({
                title: form.title || null,
                description: form.description || null,
                alt_text: form.alt_text || null,
                caption: form.caption || null,
                tags: form.tags ? form.tags.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
                keywords: form.keywords ? form.keywords.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
              });
              toast.success("Saved");
              onClose();
            }}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
