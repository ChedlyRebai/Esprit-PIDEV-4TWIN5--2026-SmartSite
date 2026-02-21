import React from "react";
import Modal from "./Modal";
import useAddUserModal from "@/app/hooks/use-user-Modal";

const AddUserModal = () => {
  const { isOpen, onClose } = useAddUserModal();
  return (
    <Modal
      title="Add User"
      description="Fill in the details to create a new user account"
      isOpen={isOpen}
      onChange={onClose}
    >
      <p>Form goes here</p>
    </Modal>
  );
};

export default AddUserModal;
