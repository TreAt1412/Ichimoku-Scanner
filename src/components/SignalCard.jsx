import React from 'react';
import ChartWidget from './ChartWidget';

const fmtPrice = (v) => Math.round(v).toLocaleString('vi-VN');
// Làm tròn xuống đến bước giá 50đ gần nhất (0.05 trong đơn vị nghìn)
const roundTick = (v) => Math.floor(v / 50) * 50;

export default function SignalCard({ ticker, data, analysis, onExpand, toggles }) {
    const lastData = data[data.length - 1];
    const prevData = data.length > 1 ? data[data.length - 2] : lastData;
    
    // Tính % thay đổi so với phiên trước
    const change = lastData.close - prevData.close;
    const changePercent = prevData.close !== 0 ? (change / prevData.close * 100).toFixed(2) : 0;
    const isUp = change >= 0;
    const changeColor = isUp ? '#00FF87' : '#FF3366';
    const changeSign = isUp ? '+' : '';
    
    const isBuy = analysis.signal === 'BUY';
    const isSell = analysis.signal === 'SELL';
    
    let badgeColor = 'var(--accent-gold)';
    if (isBuy) badgeColor = 'var(--accent-neon-green)';
    if (isSell) badgeColor = 'var(--accent-crimson-red)';
    
    let glow = 'none';
    if (isBuy) glow = 'var(--glow-green)';
    if (isSell) glow = 'var(--glow-red)';

    return (
        <div style={{
            ...styles.card,
            boxShadow: analysis.signal !== 'WAIT' ? glow : 'none'
        }} className="glass-panel">
            <div style={styles.header}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h2 style={styles.ticker}>{ticker}</h2>
                        {onExpand && (
                            <button style={styles.expandBtn} onClick={() => onExpand(ticker)} title="Phóng to biểu đồ">
                                ⛶
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                        <p style={styles.price} className="mono">{fmtPrice(lastData.close)}</p>
                        <span className="mono" style={{ color: changeColor, fontSize: '1rem', fontWeight: '500' }}>
                            {changeSign}{changePercent}%
                        </span>
                    </div>
                </div>
                <div style={{
                    ...styles.badge,
                    backgroundColor: badgeColor + '22',
                    color: badgeColor,
                    border: `1px solid ${badgeColor}`,
                    boxShadow: analysis.signal !== 'WAIT' ? `0 0 8px ${badgeColor}44` : 'none'
                }} className={analysis.signal !== 'WAIT' ? 'signal-blinker' : ''}>
                    {analysis.signal}
                </div>
            </div>
            
            {analysis.kijun129 && (
                <>
                    <div style={styles.infoRow}>
                        <span style={{ color: 'var(--text-secondary)' }}>Giá 129:</span>
                        <span className="mono" style={{ color: '#9F1919' }}>{fmtPrice(analysis.kijun129)}</span>
                    </div>
                    <div style={styles.buyZone}>
                        Vùng giá mua (±1%): 
                        <strong style={{ color: 'var(--accent-neon-green)', marginLeft: '8px' }}>
                            <span className="mono">{fmtPrice(roundTick(analysis.kijun129 * 0.99))}</span> — <span className="mono">{fmtPrice(roundTick(analysis.kijun129 * 1.01))}</span>
                        </strong>
                    </div>
                </>
            )}
            
            <div style={styles.chartContainer}>
                <ChartWidget data={data} toggles={toggles} />
            </div>
        </div>
    );
}

const styles = {
    card: {
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        transition: 'all 0.3s ease',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    ticker: {
        fontSize: '1.5rem',
        margin: 0,
        color: '#FFF'
    },
    price: {
        fontSize: '1.2rem',
        margin: '5px 0 0 0',
        color: 'var(--text-secondary)'
    },
    badge: {
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        letterSpacing: '1px'
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.95rem',
    },
    buyZone: {
        background: 'rgba(0, 255, 135, 0.05)',
        padding: '10px 12px',
        borderRadius: '6px',
        borderLeft: '3px solid var(--accent-neon-green)',
        fontSize: '0.9rem',
        color: 'var(--text-primary)'
    },
    chartContainer: {
        marginTop: '10px',
        borderRadius: '8px',
        overflow: 'hidden'
    },
    expandBtn: {
        background: 'transparent',
        border: '1px solid var(--border-color)',
        color: 'var(--text-secondary)',
        borderRadius: '4px',
        cursor: 'pointer',
        padding: '0 6px',
        fontSize: '1.2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
    }
}
