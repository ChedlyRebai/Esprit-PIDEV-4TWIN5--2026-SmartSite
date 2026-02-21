import React from "react";
import Modal from "./Modal";
import useAddPermissionModal from "@/app/hooks/use-permission-Modal";

const AddPermissionModal = () => {
  const { isOpen, onClose } = useAddPermissionModal();
  return (
    <Modal
      title="Add Permission"
      description="Fill in the details to create a new permission"
      isOpen={isOpen}
      onChange={onClose}
    >
      AddPermissionModal forms
    </Modal>
  );
};

export default AddPermissionModal;
