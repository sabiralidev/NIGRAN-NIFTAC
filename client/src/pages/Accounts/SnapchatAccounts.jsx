import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Users, UserX, X } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import AccountCard from '../../components/AccountCard'
import { getPlatformDummyAccounts } from '../../utils/dummyData'

const platformConfig = {
  label: "Snapchat",
  color: "#FFFC00",
}

const AddAccountModal = ({ onClose }) => {
  const [username, setUsername] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Adding account:', username)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white border border-border rounded-2xl p-6 w-full max-w-md shadow-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">Add {platformConfig.label} Account</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-700 text-sm mb-2">{platformConfig.label} Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">@</span>
              <input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace('@', ''))}
                className="input-field pl-8"
                required
                autoFocus
                minLength={1}
                maxLength={50}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              style={{ backgroundColor: platformConfig.color, color: '#000' }}
            >
              <Plus size={16} />
              Add Account
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

const SnapchatAccounts = () => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const accounts = getPlatformDummyAccounts('snapchat')

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout>
      <AnimatePresence>
        {showAddModal && <AddAccountModal onClose={() => setShowAddModal(false)} />}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          <span style={{ color: platformConfig.color }}>{platformConfig.label}</span> Accounts
        </h1>
        <motion.button
          onClick={() => setShowAddModal(true)}
          whileTap={{ scale: 0.95 }}
          className="btn-primary flex items-center gap-2"
          style={{ backgroundColor: platformConfig.color, color: '#000' }}
        >
          <Plus size={16} />
          Add Account
        </motion.button>
      </div>

      <div className="mb-6 relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search accounts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {filteredAccounts.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredAccounts.map((account) => (
            <AccountCard key={account.id} account={account} platform="snapchat" />
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <UserX size={48} className="mx-auto text-slate-500" />
          <h3 className="mt-4 text-lg font-semibold text-slate-700">No Accounts Found</h3>
          <p className="mt-1 text-sm text-slate-500">
            No {platformConfig.label} accounts match your search.
          </p>
        </div>
      )}
    </DashboardLayout>
  )
}

export default SnapchatAccounts
