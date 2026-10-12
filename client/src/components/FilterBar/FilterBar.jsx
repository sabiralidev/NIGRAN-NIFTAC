import { ChevronDown, CalendarDays, Filter, Hash, Share2 } from 'lucide-react'

const FilterBar = ({ keyword, onKeywordChange, social, onSocialChange, dateRange, onDateRangeChange }) => {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
      <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
        <span style={{ color: 'var(--text-muted)' }}>Filters</span>
      </div>

      <div className="relative min-w-[180px] flex-1 md:flex-none">
      
        <select
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          className="filter-select w-full pl-9 pr-10"
        >
          <option value="all">All keywords</option>
          <option value="inqilab">Inqilab</option>
          <option value="jihaad">Jihaad</option>
          <option value="freedom">Freedom</option>
          <option value="bla">BLA</option>
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
      </div>

      <div className="relative min-w-[180px] flex-1 md:flex-none">
        <select
          value={social}
          onChange={(e) => onSocialChange(e.target.value)}
          className="filter-select w-full pl-9 pr-10"
        >
          <option value="all">All Socials</option>
          <option value="twitter">Twitter</option>
          <option value="facebook">Facebook</option>
          <option value="youtube">YouTube</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
          <option value="telegram">Telegram</option>
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
      </div>

      <div className="relative min-w-[180px] flex-1 md:flex-none">
        <select
          value={dateRange}
          onChange={(e) => onDateRangeChange(e.target.value)}
          className="filter-select w-full pl-9 pr-10"
        >
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
          <option value="1">Last 24 hours</option>
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
      </div>
    </div>
  )
}

export default FilterBar
