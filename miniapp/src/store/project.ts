import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { request } from "../api/request";
import { floodFill } from "../utils/fillBucket";
import { removeBackground } from "../utils/removeBackground";

const RECENT_COLORS_KEY = "recent_colors";
const MAX_RECENT = 5;

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
    const newRow = [...gridData.value[row]];
    newRow[col] = colorId;
    const newData = [...gridData.value];
    newData[row] = newRow;
    gridData.value = newData;
    pushRecentColor(colorId);
  }

  function fillArea(row: number, col: number, fillColor: string): number {
    const result = floodFill(gridData.value, row, col, fillColor);
    if (!result) return 0;
    gridData.value = result.grid;
    pushRecentColor(fillColor);
    return result.count;
  }

  function removeBg(): number {
    const result = removeBackground(gridData.value, colorMap.value);
    if (!result) return 0;
    gridData.value = result.grid;
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
      await loadColors(p.brand);
      return true;
    } catch (err: unknown) {
      console.error("[project/load]", err);
      return false;
    } finally {
      loading.value = false;
    }
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
    updateCell,
    fillArea,
    removeBg,
    loadProject,
  };
});
