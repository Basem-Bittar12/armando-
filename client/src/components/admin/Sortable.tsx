/**
 * قائمة تترتب بالسحب — بالماوس أو باللمس، من مقبض السحب فقط (فيبقى سكرول التلفون عادياً).
 * الكيبورد: Tab للمقبض ثم مسافة للإمساك، والأسهم للتحريك، ومسافة للإفلات.
 */
import type { ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

export type HandleProps = Record<string, unknown> & { ref: (node: HTMLElement | null) => void };

function SortableItem({ id, className, children }: { id: string; className?: string; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button
      type="button"
      className="adm-handle"
      ref={setActivatorNodeRef}
      aria-label="اسحب لتغيير الترتيب"
      {...attributes}
      {...listeners}
    >
      <GripVertical size={18} />
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      className={`${className ?? ""} ${isDragging ? "is-dragging" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {children(handle)}
    </div>
  );
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  itemClassName,
  className,
  layout = "list",
}: {
  items: T[];
  onReorder: (ids: string[]) => void;
  /** handle = مقبض السحب الجاهز ليوضع داخل العنصر */
  renderItem: (item: T, handle: ReactNode, index: number) => ReactNode;
  itemClassName?: string;
  className?: string;
  layout?: "list" | "grid";
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((item) => item.id === active.id);
    const to = items.findIndex((item) => item.id === over.id);
    onReorder(arrayMove(items, from, to).map((item) => item.id));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy}>
        <div className={className}>
          {items.map((item, index) => (
            <SortableItem key={item.id} id={item.id} className={itemClassName}>
              {(handle) => renderItem(item, handle, index)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
