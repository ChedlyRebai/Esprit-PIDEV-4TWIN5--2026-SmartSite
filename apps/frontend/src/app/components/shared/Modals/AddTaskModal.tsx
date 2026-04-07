import React from "react";
import Modal from "./Modal";
import useRoleModal from "@/app/hooks/use-role-Modal";
import RoleForms from "../../forms/RoleForms";
import TaskForms from "../../forms/TaskForms";
import useTaskModal from "@/app/hooks/use-task-modal";

const AddTaskModal = () => {
  const { isOpen, onClose,setType,type } = useTaskModal();
  return (
    <Modal
      title={type === "add" ? "Add New Task" : "Edit Task"}
      description={type === "add" ? "Fill in the details to create a new task" : "Update the task information"}
      isOpen={isOpen}
      onChange={onClose}
    >
      <TaskForms type={type} />
    </Modal>
  );
};

export default AddTaskModal;
