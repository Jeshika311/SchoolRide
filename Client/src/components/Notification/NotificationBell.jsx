import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiChevronDown, FiCheckCircle } from 'react-icons/fi';
import { useNotifications } from '../../context/NotificationContext';
import NotificationList from './NotificationList';

export default function NotificationBell() {
	const { notifications, unreadCount, markAllAsRead, markAsRead, deleteNotification } = useNotifications();
	const [open, setOpen] = useState(false);
	const wrapperRef = useRef(null);
	const navigate = useNavigate();

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
				setOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<div ref={wrapperRef} style={{ position: 'relative' }}>
			<button
				type="button"
				onClick={() => setOpen((previous) => !previous)}
				style={{
					position: 'relative',
					width: '58px',
					height: '58px',
					borderRadius: '20px',
					border: '1px solid #dbeafe',
					background: '#eff6ff',
					color: '#2563eb',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					lineHeight: 0,
					padding: 0,
					cursor: 'pointer',
					boxShadow: '0 8px 20px rgba(37, 99, 235, 0.12)'
				}}
				aria-label="Open notifications"
			>
				<FiBell size={32} strokeWidth={2.2} style={{ display: 'block', transform: 'translateY(0.5px)' }} />
				{unreadCount > 0 && (
					<span
						style={{
							position: 'absolute',
							top: '-3px',
							right: '-3px',
							minWidth: '22px',
							height: '22px',
							padding: '0 6px',
							borderRadius: '999px',
							background: '#ef4444',
							color: '#fff',
							fontSize: '12px',
							fontWeight: 800,
							display: 'grid',
							placeItems: 'center',
							border: '2px solid #fff'
						}}
					>
						{unreadCount}
					</span>
				)}
			</button>

			{open && (
				<div
					style={{
						position: 'absolute',
						right: 0,
						top: 'calc(100% + 12px)',
						width: 'min(420px, calc(100vw - 24px))',
						maxHeight: '70vh',
						overflow: 'auto',
						background: '#f8fafc',
						borderRadius: '24px',
						border: '1px solid #e2e8f0',
						boxShadow: '0 24px 60px rgba(15, 23, 42, 0.18)',
						zIndex: 50
					}}
				>
					<div style={{ padding: '18px 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
						<div>
							<h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Notifications</h3>
							<p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>{unreadCount} unread</p>
						</div>
						<button
							type="button"
							onClick={() => {
								navigate('/notifications');
								setOpen(false);
							}}
							style={{
								border: 'none',
								background: '#fff',
								color: '#2563eb',
								borderRadius: '999px',
								padding: '8px 12px',
								cursor: 'pointer',
								display: 'inline-flex',
								alignItems: 'center',
								gap: '6px',
								fontWeight: 700
							}}
						>
							View all <FiChevronDown />
						</button>
					</div>

					<div style={{ padding: '0 18px 18px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
						<button
							type="button"
							onClick={() => markAllAsRead()}
							style={{
								border: '1px solid #bfdbfe',
								background: '#eff6ff',
								color: '#1d4ed8',
								borderRadius: '999px',
								padding: '8px 12px',
								cursor: 'pointer',
								fontWeight: 700,
								display: 'inline-flex',
								alignItems: 'center',
								gap: '6px'
							}}
						>
							<FiCheckCircle />
							Mark all read
						</button>
					</div>

					<div style={{ padding: '0 18px 18px' }}>
						<NotificationList
							notifications={notifications.slice(0, 5)}
							onMarkRead={markAsRead}
							onDelete={deleteNotification}
						/>
					</div>
				</div>
			)}
		</div>
	);
}

