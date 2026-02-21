import React from "react";
import AddPermissionModal from "../components/shared/Modals/AddPermissionModal";
import AddUserModal from "../components/shared/Modals/AddUserModal";

const ModalProvider = () => {
  return (
    <>
      <AddPermissionModal />
      <AddPermissionModal />
      <AddUserModal />
    </>
  );
};

export default ModalProvider;
