import React, { useMemo, useState } from 'react';
import { analyzeVolSpike } from '../utils/ichimoku';
import ChartWidget from './ChartWidget';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtPrice = (v) => Math.round(v).toLocaleString('vi-VN');
const fmtVolM  = (v) => {
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M';
    if (v >= 1_000)     return (v / 1_000).toFixed(1) + 'K';
    return Math.round(v).toString();
};

// ── Badge tỷ lệ KL/MA20 ───────────────────────────────────────────────────────
function RatioBadge({ value }) {
    const color = value >= 3.0 ? '#00FF87'
                : value >= 2.0 ? '#FF8C00'
                : '#FFD700';
    return (
        <span style={{
            background: color + '22',
            color,
            border: `1px solid ${color}`,
            borderRadius: 12,
            padding: '2px 10px',
            fontSize: '0.82rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
        }}>
            {value.toFixed(2)}x
        </span>
    );
}

// ── Ô KL với nền xanh nhẹ (đã vượt ngưỡng) ───────────────────────────────────
function VolCell({ value, ratio }) {
    const color = ratio >= 3.0 ? '#00FF87'
                : ratio >= 2.0 ? '#FF8C00'
                : '#FFD700';
    return (
        <span style={{
            background: color + '18',
            color: 'var(--text-primary)',
            borderRadius: 6,
            padding: '2px 8px',
            fontFamily: 'monospace',
            fontSize: '0.88rem',
            borderLeft: `2px solid ${color}`,
        }}>
            {fmtVolM(value)}
        </span>
    );
}

// ── Component chính ───────────────────────────────────────────────────────────
export default function VolSpikeTab({ tickersData, toggles }) {
    const [expandedTicker, setExpandedTicker] = useState(null);
    const [sortKey, setSortKey]   = useState('minRatio');
    const [sortDir, setSortDir]   = useState(-1); // -1 = desc (mặc định: ratio cao nhất lên đầu)

    // ── Tính toán danh sách ──────────────────────────────────────────────────
    const results = useMemo(() => {
        const out = [];
        for (const [ticker, data] of Object.entries(tickersData)) {
            if (!data || data.length < 23) continue;
            const res = analyzeVolSpike(data, 1.5);
            if (!res.qualifies) continue;
            out.push({ ticker, ...res });
        }
        return out.sort((a, b) => {
            const va = a[sortKey], vb = b[sortKey];
            if (typeof va === 'string') return va.localeCompare(vb) * sortDir;
            return (va - vb) * sortDir;
        });
    }, [tickersData, sortKey, sortDir]);

    function handleSort(key) {
        if (sortKey === key) setSortDir(d => d * -1);
        else { setSortKey(key); setSortDir(-1); }
    }

    function Th({ col, label, title }) {
        const active = sortKey === col;
        return (
            <th
                onClick={() => handleSort(col)}
                title={title}
                style={{
                    ...thStyle,
                    color: active ? '#00FF87' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                }}
            >
                {label}{active ? (sortDir === -1 ? ' ↓' : ' ↑') : ''}
            </th>
        );
    }

    return (
        <div>
            {/* ── Banner ──────────────────────────────────────────────────── */}
            <div style={bannerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '1.4rem' }}>📊</span>
                    <div>
                        <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                            KL 3 phiên liên tiếp &nbsp;≥&nbsp; 1.5× MA20
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 2 }}>
                            Lọc mã có dòng tiền đổ vào liên tục — MA20 tính từ 20 phiên trước 3 phiên gần nhất
                        </div>
                    </div>
                </div>
                <div style={badgeCountStyle}>
                    {results.length} mã
                </div>
            </div>

            {/* ── Bảng ────────────────────────────────────────────────────── */}
            {results.length === 0 ? (
                <div style={emptyStyle}>
                    ✅ Không có mã nào thỏa điều kiện trong dữ liệu hiện tại.
                </div>
            ) : (
                <div style={tableWrapper}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <Th col="ticker"   label="Mã"        title="Mã chứng khoán" />
                                <Th col="lastPrice" label="Giá"      title="Giá đóng cửa phiên gần nhất" />
                                <Th col="chgPct"   label="Thay đổi"  title="% thay đổi so với phiên trước" />
                                <Th col="vol3[0]"  label="KL T-2"    title="Khối lượng phiên cách 2 ngày" />
                                <Th col="vol3[1]"  label="KL T-1"    title="Khối lượng phiên hôm qua" />
                                <Th col="vol3[2]"  label="KL T0"     title="Khối lượng phiên gần nhất" />
                                <Th col="ma20"     label="MA20 KL"   title="Trung bình KL 20 phiên trước" />
                                <Th col="minRatio" label="Tỷ lệ min" title="Tỷ lệ thấp nhất trong 3 phiên (KL/MA20)" />
                                <Th col="lastDate" label="Ngày"      title="Ngày phiên gần nhất" />
                                <th style={thStyle} />
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((r, i) => {
                                const isUp      = r.chgPct >= 0;
                                const chgColor  = isUp ? '#00FF87' : '#FF3366';
                                const isExpanded = expandedTicker === r.ticker;
                                const rowBg     = i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';

                                return (
                                    <React.Fragment key={r.ticker}>
                                        <tr
                                            style={{
                                                background: isExpanded ? 'rgba(0,255,135,0.05)' : rowBg,
                                                transition: 'background .2s',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            onMouseLeave={e => e.currentTarget.style.background = isExpanded ? 'rgba(0,255,135,0.05)' : rowBg}
                                        >
                                            {/* Mã */}
                                            <td style={{ ...tdStyle, fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
                                                {r.ticker}
                                            </td>

                                            {/* Giá */}
                                            <td style={{ ...tdStyle, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                                                {fmtPrice(r.lastPrice)}
                                            </td>

                                            {/* Thay đổi */}
                                            <td style={{ ...tdStyle, color: chgColor, fontWeight: 600 }}>
                                                {isUp ? '+' : ''}{r.chgPct.toFixed(2)}%
                                            </td>

                                            {/* KL T-2 */}
                                            <td style={tdStyle}>
                                                <VolCell value={r.vol3[0]} ratio={r.ratios[0]} />
                                            </td>

                                            {/* KL T-1 */}
                                            <td style={tdStyle}>
                                                <VolCell value={r.vol3[1]} ratio={r.ratios[1]} />
                                            </td>

                                            {/* KL T0 */}
                                            <td style={tdStyle}>
                                                <VolCell value={r.vol3[2]} ratio={r.ratios[2]} />
                                            </td>

                                            {/* MA20 KL */}
                                            <td style={{ ...tdStyle, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                                                {fmtVolM(r.ma20)}
                                            </td>

                                            {/* Tỷ lệ min */}
                                            <td style={tdStyle}>
                                                <RatioBadge value={r.minRatio} />
                                            </td>

                                            {/* Ngày */}
                                            <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                                                {r.lastDate}
                                            </td>

                                            {/* Expand */}
                                            <td style={{ ...tdStyle, textAlign: 'right' }}>
                                                <button
                                                    style={expandBtnStyle}
                                                    onClick={() => setExpandedTicker(isExpanded ? null : r.ticker)}
                                                    title={isExpanded ? 'Thu gọn' : 'Xem biểu đồ'}
                                                >
                                                    {isExpanded ? '▲' : '▼'}
                                                </button>
                                            </td>
                                        </tr>

                                        {/* ── Inline chart ─────────────────── */}
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={10} style={{ padding: '0 12px 16px', background: 'rgba(0,255,135,0.03)' }}>
                                                    <div style={{
                                                        borderRadius: 10,
                                                        overflow: 'hidden',
                                                        border: '1px solid rgba(0,255,135,0.15)',
                                                        marginTop: 6,
                                                    }}>
                                                        <ChartWidget
                                                            data={tickersData[r.ticker]}
                                                            height={300}
                                                            toggles={toggles}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const bannerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(0,255,135,0.06)',
    border: '1px solid rgba(0,255,135,0.2)',
    borderRadius: 12,
    padding: '14px 20px',
    marginBottom: 24,
};

const badgeCountStyle = {
    background: 'rgba(0,255,135,0.15)',
    color: '#00FF87',
    border: '1px solid rgba(0,255,135,0.3)',
    borderRadius: 20,
    padding: '4px 16px',
    fontWeight: 700,
    fontSize: '0.9rem',
};

const emptyStyle = {
    textAlign: 'center',
    color: 'var(--text-secondary)',
    padding: '50px 0',
    fontSize: '1rem',
};

const tableWrapper = {
    overflowX: 'auto',
    borderRadius: 10,
    border: '1px solid var(--border-color)',
};

const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
};

const thStyle = {
    padding: '12px 16px',
    borderBottom: '1px solid var(--border-color)',
    textAlign: 'left',
    fontSize: '0.78rem',
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    background: 'var(--bg-card)',
};

const tdStyle = {
    padding: '11px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
};

const expandBtnStyle = {
    background: 'transparent',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    borderRadius: 4,
    cursor: 'pointer',
    padding: '2px 8px',
    fontSize: '0.8rem',
    transition: 'all .2s',
};
