import React from 'react'

interface ConfirmModalProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  danger = false,
}) => {
  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[90%] max-w-[420px] rounded-[14px] border border-[#2a2d36] bg-[#1c1f26] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
      >
        <div className="mb-2 text-base font-bold text-[#e8eaed]">{title}</div>
        <div className="mb-6 text-[13px] leading-relaxed text-[#9ca3af]">{message}</div>
        <div className="flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="cursor-pointer rounded-lg border border-[#2a2d36] bg-transparent px-[18px] py-2 text-[13px] font-semibold text-[#9ca3af] transition-colors hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`cursor-pointer rounded-lg border-none px-[18px] py-2 text-[13px] font-semibold text-white transition-colors ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {danger ? 'Remove' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
