import { create } from "zustand";

interface addRoleModalStore {
  id?: string | number;
  setId: (id: string | number) => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useAddRoleModal = create<addRoleModalStore>(
  (set) => ({
    id: undefined,
    isOpen: false,
    setId: (id) => set({ id }),
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false }),
  })
);

export default useAddRoleModal;