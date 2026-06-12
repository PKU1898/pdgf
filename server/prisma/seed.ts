import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();

interface BeadColorSeed {
  id: string;
  brand: string;
  code: string;
  hexCode: string;
  rgb: string;
  name: string;
}

const mardColors: BeadColorSeed[] = [
  { id: "mard_001", brand: "mard", code: "001", hexCode: "#FFFFFF", rgb: "255,255,255", name: "白色" },
  { id: "mard_002", brand: "mard", code: "002", hexCode: "#F5F5F5", rgb: "245,245,245", name: "米白" },
  { id: "mard_003", brand: "mard", code: "003", hexCode: "#FFB6C1", rgb: "255,182,193", name: "浅粉" },
  { id: "mard_004", brand: "mard", code: "004", hexCode: "#FF69B4", rgb: "255,105,180", name: "粉红" },
  { id: "mard_005", brand: "mard", code: "005", hexCode: "#FF1493", rgb: "255,20,147", name: "深粉" },
  { id: "mard_006", brand: "mard", code: "006", hexCode: "#FF0000", rgb: "255,0,0", name: "红色" },
  { id: "mard_007", brand: "mard", code: "007", hexCode: "#DC143C", rgb: "220,20,60", name: "深红" },
  { id: "mard_008", brand: "mard", code: "008", hexCode: "#8B0000", rgb: "139,0,0", name: "暗红" },
  { id: "mard_009", brand: "mard", code: "009", hexCode: "#FF6347", rgb: "255,99,71", name: "橙红" },
  { id: "mard_010", brand: "mard", code: "010", hexCode: "#FFA500", rgb: "255,165,0", name: "橙色" },
  { id: "mard_011", brand: "mard", code: "011", hexCode: "#FF8C00", rgb: "255,140,0", name: "深橙" },
  { id: "mard_012", brand: "mard", code: "012", hexCode: "#FFD700", rgb: "255,215,0", name: "金色" },
  { id: "mard_013", brand: "mard", code: "013", hexCode: "#FFFF00", rgb: "255,255,0", name: "黄色" },
  { id: "mard_014", brand: "mard", code: "014", hexCode: "#ADFF2F", rgb: "173,255,47", name: "黄绿" },
  { id: "mard_015", brand: "mard", code: "015", hexCode: "#7CFC00", rgb: "124,252,0", name: "草绿" },
  { id: "mard_016", brand: "mard", code: "016", hexCode: "#00FF00", rgb: "0,255,0", name: "绿色" },
  { id: "mard_017", brand: "mard", code: "017", hexCode: "#32CD32", rgb: "50,205,50", name: " lime绿" },
  { id: "mard_018", brand: "mard", code: "018", hexCode: "#228B22", rgb: "34,139,34", name: "深绿" },
  { id: "mard_019", brand: "mard", code: "019", hexCode: "#006400", rgb: "0,100,0", name: "墨绿" },
  { id: "mard_020", brand: "mard", code: "020", hexCode: "#00FFFF", rgb: "0,255,255", name: "青色" },
  { id: "mard_021", brand: "mard", code: "021", hexCode: "#00CED1", rgb: "0,206,209", name: "深青" },
  { id: "mard_022", brand: "mard", code: "022", hexCode: "#40E0D0", rgb: "64,224,208", name: " turquoise" },
  { id: "mard_023", brand: "mard", code: "023", hexCode: "#87CEEB", rgb: "135,206,235", name: "天蓝" },
  { id: "mard_024", brand: "mard", code: "024", hexCode: "#1E90FF", rgb: "30,144,255", name: "道奇蓝" },
  { id: "mard_025", brand: "mard", code: "025", hexCode: "#0000FF", rgb: "0,0,255", name: "蓝色" },
  { id: "mard_026", brand: "mard", code: "026", hexCode: "#0000CD", rgb: "0,0,205", name: "中蓝" },
  { id: "mard_027", brand: "mard", code: "027", hexCode: "#00008B", rgb: "0,0,139", name: "深蓝" },
  { id: "mard_028", brand: "mard", code: "028", hexCode: "#4169E1", rgb: "65,105,225", name: "皇家蓝" },
  { id: "mard_029", brand: "mard", code: "029", hexCode: "#8A2BE2", rgb: "138,43,226", name: "蓝紫" },
  { id: "mard_030", brand: "mard", code: "030", hexCode: "#9400D3", rgb: "148,0,211", name: "暗紫" },
  { id: "mard_031", brand: "mard", code: "031", hexCode: "#800080", rgb: "128,0,128", name: "紫色" },
  { id: "mard_032", brand: "mard", code: "032", hexCode: "#BA55D3", rgb: "186,85,211", name: " orchid紫" },
  { id: "mard_033", brand: "mard", code: "033", hexCode: "#DDA0DD", rgb: "221,160,221", name: "梅红" },
  { id: "mard_034", brand: "mard", code: "034", hexCode: "#C0C0C0", rgb: "192,192,192", name: "银色" },
  { id: "mard_035", brand: "mard", code: "035", hexCode: "#808080", rgb: "128,128,128", name: "灰色" },
  { id: "mard_036", brand: "mard", code: "036", hexCode: "#404040", rgb: "64,64,64", name: "深灰" },
  { id: "mard_037", brand: "mard", code: "037", hexCode: "#000000", rgb: "0,0,0", name: "黑色" },
  { id: "mard_038", brand: "mard", code: "038", hexCode: "#8B4513", rgb: "139,69,19", name: "鞍褐" },
  { id: "mard_039", brand: "mard", code: "039", hexCode: "#A0522D", rgb: "160,82,45", name: "赭石" },
  { id: "mard_040", brand: "mard", code: "040", hexCode: "#D2691E", rgb: "210,105,30", name: "巧克力" },
  { id: "mard_041", brand: "mard", code: "041", hexCode: "#F4A460", rgb: "244,164,96", name: "沙褐" },
  { id: "mard_042", brand: "mard", code: "042", hexCode: "#FFDEAD", rgb: "255,222,173", name: "纳瓦白" },
  { id: "mard_043", brand: "mard", code: "043", hexCode: "#FAEBD7", rgb: "250,235,215", name: "古董白" },
  { id: "mard_044", brand: "mard", code: "044", hexCode: "#FFE4C4", rgb: "255,228,196", name: " bisque" },
  { id: "mard_045", brand: "mard", code: "045", hexCode: "#FFDAB9", rgb: "255,218,185", name: "桃色" },
];

const cocoColors: BeadColorSeed[] = [
  { id: "coco_001", brand: "coco", code: "001", hexCode: "#FFFFFF", rgb: "255,255,255", name: "白色" },
  { id: "coco_002", brand: "coco", code: "002", hexCode: "#FFF5EE", rgb: "255,245,238", name: "海贝白" },
  { id: "coco_003", brand: "coco", code: "003", hexCode: "#FFC0CB", rgb: "255,192,203", name: "粉色" },
  { id: "coco_004", brand: "coco", code: "004", hexCode: "#FFB6C1", rgb: "255,182,193", name: "浅粉" },
  { id: "coco_005", brand: "coco", code: "005", hexCode: "#FF69B4", rgb: "255,105,180", name: "热粉" },
  { id: "coco_006", brand: "coco", code: "006", hexCode: "#FF1493", rgb: "255,20,147", name: "深粉" },
  { id: "coco_007", brand: "coco", code: "007", hexCode: "#FF0000", rgb: "255,0,0", name: "红色" },
  { id: "coco_008", brand: "coco", code: "008", hexCode: "#CD5C5C", rgb: "205,92,92", name: "印度红" },
  { id: "coco_009", brand: "coco", code: "009", hexCode: "#B22222", rgb: "178,34,34", name: "耐火砖" },
  { id: "coco_010", brand: "coco", code: "010", hexCode: "#FFA07A", rgb: "255,160,122", name: "浅鲑红" },
  { id: "coco_011", brand: "coco", code: "011", hexCode: "#FF7F50", rgb: "255,127,80", name: "珊瑚" },
  { id: "coco_012", brand: "coco", code: "012", hexCode: "#FF8C00", rgb: "255,140,0", name: "深橙" },
  { id: "coco_013", brand: "coco", code: "013", hexCode: "#FFA500", rgb: "255,165,0", name: "橙色" },
  { id: "coco_014", brand: "coco", code: "014", hexCode: "#FFD700", rgb: "255,215,0", name: "金色" },
  { id: "coco_015", brand: "coco", code: "015", hexCode: "#FFFF00", rgb: "255,255,0", name: "黄色" },
  { id: "coco_016", brand: "coco", code: "016", hexCode: "#FFFACD", rgb: "255,250,205", name: "柠檬绸" },
  { id: "coco_017", brand: "coco", code: "017", hexCode: "#FAFAD2", rgb: "250,250,210", name: "浅金菊" },
  { id: "coco_018", brand: "coco", code: "018", hexCode: "#90EE90", rgb: "144,238,144", name: "浅绿" },
  { id: "coco_019", brand: "coco", code: "019", hexCode: "#3CB371", rgb: "60,179,113", name: "中海绿" },
  { id: "coco_020", brand: "coco", code: "020", hexCode: "#2E8B57", rgb: "46,139,87", name: "海绿" },
  { id: "coco_021", brand: "coco", code: "021", hexCode: "#008000", rgb: "0,128,0", name: "绿色" },
  { id: "coco_022", brand: "coco", code: "022", hexCode: "#006400", rgb: "0,100,0", name: "深绿" },
  { id: "coco_023", brand: "coco", code: "023", hexCode: "#48D1CC", rgb: "72,209,204", name: "中 turquoise" },
  { id: "coco_024", brand: "coco", code: "024", hexCode: "#00CED1", rgb: "0,206,209", name: "深 turquoise" },
  { id: "coco_025", brand: "coco", code: "025", hexCode: "#87CEFA", rgb: "135,206,250", name: "浅天蓝" },
  { id: "coco_026", brand: "coco", code: "026", hexCode: "#6495ED", rgb: "100,149,237", name: "矢车菊蓝" },
  { id: "coco_027", brand: "coco", code: "027", hexCode: "#4169E1", rgb: "65,105,225", name: "皇家蓝" },
  { id: "coco_028", brand: "coco", code: "028", hexCode: "#0000FF", rgb: "0,0,255", name: "蓝色" },
  { id: "coco_029", brand: "coco", code: "029", hexCode: "#000080", rgb: "0,0,128", name: "海军蓝" },
  { id: "coco_030", brand: "coco", code: "030", hexCode: "#191970", rgb: "25,25,112", name: "午夜蓝" },
  { id: "coco_031", brand: "coco", code: "031", hexCode: "#8B008B", rgb: "139,0,139", name: "深紫" },
  { id: "coco_032", brand: "coco", code: "032", hexCode: "#9370DB", rgb: "147,112,219", name: "中紫" },
  { id: "coco_033", brand: "coco", code: "033", hexCode: "#DA70D6", rgb: "218,112,214", name: "兰花紫" },
  { id: "coco_034", brand: "coco", code: "034", hexCode: "#EE82EE", rgb: "238,130,238", name: "紫罗兰" },
  { id: "coco_035", brand: "coco", code: "035", hexCode: "#D8BFD8", rgb: "216,191,216", name: "蓟紫" },
  { id: "coco_036", brand: "coco", code: "036", hexCode: "#C0C0C0", rgb: "192,192,192", name: "银色" },
  { id: "coco_037", brand: "coco", code: "037", hexCode: "#A9A9A9", rgb: "169,169,169", name: "暗灰" },
  { id: "coco_038", brand: "coco", code: "038", hexCode: "#696969", rgb: "105,105,105", name: "昏灰" },
  { id: "coco_039", brand: "coco", code: "039", hexCode: "#000000", rgb: "0,0,0", name: "黑色" },
  { id: "coco_040", brand: "coco", code: "040", hexCode: "#D2B48C", rgb: "210,180,140", name: "棕褐" },
  { id: "coco_041", brand: "coco", code: "041", hexCode: "#C4A484", rgb: "196,164,132", name: "米棕" },
  { id: "coco_042", brand: "coco", code: "042", hexCode: "#BC8F8F", rgb: "188,143,143", name: "玫瑰棕" },
  { id: "coco_043", brand: "coco", code: "043", hexCode: "#A0522D", rgb: "160,82,45", name: "赭石" },
  { id: "coco_044", brand: "coco", code: "044", hexCode: "#8B4513", rgb: "139,69,19", name: "鞍褐" },
  { id: "coco_045", brand: "coco", code: "045", hexCode: "#F5DEB3", rgb: "245,222,179", name: "小麦色" },
];

async function main() {
  const allColors = [...mardColors, ...cocoColors];

  console.log(`开始写入 ${allColors.length} 条色卡数据...`);

  const result = await prisma.beadColor.createMany({
    data: allColors,
    skipDuplicates: true,
  });

  console.log(`成功写入 ${result.count} 条色卡数据`);
  console.log(`  - MARD: ${mardColors.length} 色`);
  console.log(`  - COCO: ${cocoColors.length} 色`);
}

main()
  .catch((err) => {
    console.error("种子脚本执行失败:", err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
