

import { create } from "zustand";

interface TaskModalStore {
  id?: string | number;
  setId: (id: string | number) => void;
  setMilestoneid:(id:string) => void;
  milestoneId:string;
  type: "add" | "edit";
  setType:(type: "add" | "edit") => void
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
   onTaskChange: () => void;
  setOnTaskChange: (callback: () => void) => void;
}

const useTaskModal = create<TaskModalStore>(
  (set) => ({
    id: undefined,
    type:"add",
    milestoneId:undefined,
    setType: (type) => set({type}),
    setMilestoneid:(id) => set({milestoneId: id}),
    isOpen: false,
    setId: (id) => set({ id : id }),
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false }),
        onTaskChange: () => {},
    setOnTaskChange: (callback) => set({ onTaskChange: callback }),
  })
);

export default useTaskModal;