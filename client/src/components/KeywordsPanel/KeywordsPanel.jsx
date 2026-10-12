import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useKeywords, useAddKeyword, useRemoveKeyword } from '../../hooks/useDashboard'

const KeywordsPanel = ({ className = 'stat-box' }) => {
  const [newWord, setNewWord] = useState('')
  const [adding, setAdding] = useState(false)

  const { data, isLoading } = useKeywords()
  const addMutation = useAddKeyword()
  const removeMutation = useRemoveKeyword()

  const keywords = data?.keywords || []

  const handleAdd = async () => {
    if (!newWord.trim()) return
    await addMutation.mutateAsync(newWord.trim())
    setNewWord('')
    setAdding(false)
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="section-header mb-0">Keywords</h3>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1 rounded-full border border-border bg-slate-50 p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
        >
          <Plus size={13} />
        </button>
      </div>

      {adding && (
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add keyword..."
            className="input-field flex-1 py-2 text-sm"
            autoFocus
          />
          <button
            onClick={handleAdd}
            disabled={addMutation.isPending}
            className="btn-primary px-4 py-2 text-xs"
          >
            Add
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-slate-100" />
          ))
        ) : keywords.length === 0 ? (
          <span className="rounded-2xl border border-dashed border-border bg-slate-50 px-4 py-6 text-sm text-slate-500 w-full text-center">No keywords yet</span>
        ) : (
          keywords.map((kw) => (
            <span key={kw._id} className="keyword-tag">
              {kw.word}
              <button
                onClick={() => removeMutation.mutate(kw._id)}
                className="ml-1 text-slate-400 transition-colors hover:text-red-600"
                disabled={removeMutation.isPending}
              >
                <X size={10} />
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  )
}

export default KeywordsPanel
