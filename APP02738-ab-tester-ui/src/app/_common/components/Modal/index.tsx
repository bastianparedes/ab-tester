import { X } from 'lucide-react';
import type React from 'react';
import type { JSX } from 'react';
import Shadow from '../Shadow';

interface props {
  children?: React.ReactNode;
  setModalVisible: (boolean: boolean) => void;
}

const Modal = ({ children, setModalVisible }: props): JSX.Element => {
  const handleOnClose = (): void => {
    setModalVisible(false);
  };

  return (
    <Shadow setVisible={setModalVisible}>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[5px]">
        <button
          type="button"
          className="flex items-center justify-center absolute right-0 translate-x-1/2 -translate-y-1/2 p-0 bg-white border-2 border-black rounded-full text-2xl text-black"
          data-testid="data-testid-button-closer-modal"
          onClick={handleOnClose}
        >
          <X size={24} />
        </button>
        <div className="">{children}</div>
      </div>
    </Shadow>
  );
};

export { Modal };
export default Modal;
