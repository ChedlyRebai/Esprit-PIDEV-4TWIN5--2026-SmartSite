import React from "react";
import Modal from "./Modal";
import useRoleModal from "@/app/hooks/use-role-Modal";

const AddRoleModal = () => {
  const { isOpen, onClose } = useRoleModal();
  return (
    <Modal
      title="Add Role"
      description="Fill in the details to create a new role"
      isOpen={isOpen}
      onChange={onClose}
    >
      <p>AddRoleModal forms</p>
    </Modal>
  );
};

export default AddRoleModal;
