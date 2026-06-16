import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { request } from "../api/request";
import { floodFill } from "../utils/fillBucket";
import { removeBackground } from "../utils/removeBackground";

const RECENT_COLORS_KEY = "recent_colors";
const MAX_RECENT = 5;
const MAX_HISTORY = 50;
const AUTO_SAVE_DELAY = 2000;
const UNSAVED_KEY = "unsaved_project";

interface BeadColor {
  id: string;
  brand: string;
  code: string;
  hexCode: string;
  rgb: string;
  name: string | null;
}

interface ProjectDetail {
  id: string;
  name: string;
  width: number;
  height: number;
  brand: string;
  gridData: string[][];
}

function loadRecentColors(): string[] {
  try {
    const raw = uni.getStorageSync(RECENT_COLORS_KEY);
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveRecentColors(colors: string[]): void {
  try {
    uni.setStorageSync(RECENT_COLORS_KEY, colors);
  } catch {
    // ignore storage errors
  }
}

export const useProjectStore = defineStore("project", () => {
  const projectId = ref("");
  const name = ref("");
  const width = ref(0);
  const height = ref(0);
  const brand = ref("");
  const gridData = ref<string[][]>([]);
  const colors = ref<BeadColor[]>([]);
  const recentColors = ref<string[]>(loadRecentColors());
  const loading = ref(false);

  const history = ref<string[]>([]);
  const currentIndex = ref(-1);
  const saving = ref(false);

  const canUndo = computed(() => currentIndex.value > 0);
  const canRedo = computed(() => currentIndex.value < history.value.length - 1);

  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

  function scheduleAutoSave(): void {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      autoSaveTimer = null;
      saveProject(false);
    }, AUTO_SAVE_DELAY);
  }

  async function saveProject(force: boolean = true): Promise<boolean> {
    if (!projectId.value) return false;
    if (saving.value) return false;

    saving.value = true;
    try {
      await request({
        url: `/project/${projectId.value}`,
        method: "PUT",
        data: { gridData: gridData.value },
      });
      clearUnsavedCache();
      if (force) {
        uni.showToast({ title: "保存成功", icon: "success" });
      }
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "保存失败";
      console.error("[project/save]", message);
      cacheUnsavedData();
      if (force) {
        uni.showToast({ title: "保存失败，已缓存到本地", icon: "none" });
      }
      return false;
    } finally {
      saving.value = false;
    }
  }

  function cacheUnsavedData(): void {
    try {
      uni.setStorageSync(UNSAVED_KEY, {
        projectId: projectId.value,
        gridData: gridData.value,
        timestamp: Date.now(),
      });
    } catch {
      // ignore
    }
  }

  function clearUnsavedCache(): void {
    try {
      uni.removeStorageSync(UNSAVED_KEY);
    } catch {
      // ignore
    }
  }

  function getUnsavedCache(): { projectId: string; gridData: string[][]; timestamp: number } | null {
    try {
      const raw = uni.getStorageSync(UNSAVED_KEY);
      if (raw && typeof raw === "object" && "projectId" in raw) {
        return raw as { projectId: string; gridData: string[][]; timestamp: number };
      }
      return null;
    } catch {
      return null;
    }
  }

  function pushSnapshot(): void {
    const snapshot = JSON.stringify(gridData.value);
    const trimmed = history.value.slice(0, currentIndex.value + 1);
    trimmed.push(snapshot);
    if (trimmed.length > MAX_HISTORY) {
      trimmed.shift();
    }
    history.value = trimmed;
    currentIndex.value = history.value.length - 1;
  }

  function undo(): void {
    if (!canUndo.value) return;
    currentIndex.value--;
    gridData.value = JSON.parse(history.value[currentIndex.value]);
    scheduleAutoSave();
  }

  function redo(): void {
    if (!canRedo.value) return;
    currentIndex.value++;
    gridData.value = JSON.parse(history.value[currentIndex.value]);
    scheduleAutoSave();
  }

  const colorMap = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const c of colors.value) {
      map[c.id] = c.hexCode;
    }
    return map;
  });

  function pushRecentColor(colorId: string): void {
    const filtered = recentColors.value.filter((id) => id !== colorId);
    filtered.unshift(colorId);
    recentColors.value = filtered.slice(0, MAX_RECENT);
    saveRecentColors(recentColors.value);
  }

  function updateCell(row: number, col: number, colorId: string): void {
    if (row < 0 || row >= gridData.value.length) return;
    if (col < 0 || col >= (gridData.value[0]?.length ?? 0)) return;
    const current = gridData.value[row]?.[col];
    if (current === colorId) return;
    pushSnapshot();
    const newRow = [...gridData.value[row]];
    newRow[col] = colorId;
    const newData = [...gridData.value];
    newData[row] = newRow;
    gridData.value = newData;
    pushRecentColor(colorId);
    scheduleAutoSave();
  }

  function fillArea(row: number, col: number, fillColor: string): number {
    const result = floodFill(gridData.value, row, col, fillColor);
    if (!result) return 0;
    pushSnapshot();
    gridData.value = result.grid;
    pushRecentColor(fillColor);
    scheduleAutoSave();
    return result.count;
  }

  function removeBg(): number {
    const result = removeBackground(gridData.value, colorMap.value);
    if (!result) return 0;
    pushSnapshot();
    gridData.value = result.grid;
    scheduleAutoSave();
    return result.count;
  }

  async function loadProject(id: string): Promise<boolean> {
    loading.value = true;
    try {
      const res = await request<ProjectDetail>({ url: `/project/${id}` });
      const p = res.data;
      projectId.value = p.id;
      name.value = p.name;
      width.value = p.width;
      height.value = p.height;
      brand.value = p.brand;
      gridData.value = p.gridData;
      history.value = [JSON.stringify(p.gridData)];
      currentIndex.value = 0;
      await loadColors(p.brand);

      const cached = getUnsavedCache();
      if (cached && cached.projectId === id) {
        uni.showModal({
          title: "恢复未保存的修改",
          content: "检测到上次未保存的修改，是否恢复？",
          success: (modalRes) => {
            if (modalRes.confirm) {
              gridData.value = cached.gridData;
              history.value = [JSON.stringify(cached.gridData)];
              currentIndex.value = 0;
            }
            clearUnsavedCache();
          },
        });
      }

      return true;
    } catch (err: unknown) {
      console.error("[project/load]", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  function resizeGrid(newWidth: number, newHeight: number): boolean {
    const w = Math.max(10, Math.min(200, Math.round(newWidth)));
    const h = Math.max(10, Math.min(200, Math.round(newHeight)));
    if (w === width.value && h === height.value) return false;

    pushSnapshot();
    const oldGrid = gridData.value;
    const newGrid: string[][] = [];

    for (let r = 0; r < h; r++) {
      if (r < oldGrid.length) {
        const oldRow = oldGrid[r];
        const newRow: string[] = [];
        for (let c = 0; c < w; c++) {
          newRow.push(c < oldRow.length ? oldRow[c] : "");
        }
        newGrid.push(newRow);
      } else {
        newGrid.push(new Array(w).fill(""));
      }
    }

    gridData.value = newGrid;
    width.value = w;
    height.value = h;
    scheduleAutoSave();
    return true;
  }

  async function loadColors(b: string): Promise<void> {
    try {
      const res = await request<BeadColor[]>({ url: `/bead/colors?brand=${b}` });
      colors.value = res.data;
    } catch (err: unknown) {
      console.error("[project/loadColors]", err);
    }
  }

  return {
    projectId,
    name,
    width,
    height,
    brand,
    gridData,
    colors,
    colorMap,
    recentColors,
    loading,
    saving,
    canUndo,
    canRedo,
    updateCell,
    fillArea,
    removeBg,
    undo,
    redo,
    saveProject,
    resizeGrid,
    loadProject,
  };
});
