'use client'

export default function RunningTextInput({ value, onChange, maxLength = 180 }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-semibold text-zinc-300" htmlFor="running-text">
          Running text
        </label>
        <span className="text-xs text-zinc-500">{value.length}/{maxLength}</span>
      </div>
      <textarea
        id="running-text"
        rows={3}
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Nama pembicara, pengumuman, atau informasi acara..."
        className="w-full resize-none rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-sky-500"
      />
    </div>
  )
}
