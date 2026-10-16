import type React from 'react';

interface Props {
  children?: React.ReactNode;
  setVisible?: ((value: boolean) => void) | null;
  blur?: boolean;
}

const Shadow = ({ children, setVisible = null, blur = false }: Props) => {
  const handleOnClick = () => {
    if (!setVisible) return;
    setVisible(false);
  };

  return (
    <>
      <button
        type="button"
        data-testid="data-testid-shadow"
        onClick={handleOnClick}
        className={`
        fixed inset-0 w-screen h-screen z-1000
        bg-black/50
        ${blur ? 'backdrop-blur-[5px]' : ''}
      `}
      />
      <div className="fixed inset-0 z-1100 w-fit h-fit m-auto">{children}</div>
    </>
  );
};

export default Shadow;
