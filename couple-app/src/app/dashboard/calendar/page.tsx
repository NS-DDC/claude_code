'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

interface CalendarEvent {
  _id: string;
  title: string;
  description?: string;
  date: string;
  color: string;
  isAllDay: boolean;
  createdBy: { nickname: string };
}

export default function CalendarPage() {
  const { token } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', color: '#F37896' });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/events?year=${year}&month=${month + 1}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.events) setEvents(data.events);
    } catch {}
  }, [token, year, month]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => e.date.split('T')[0] === dateStr);
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newEvent),
      });
      if (res.ok) {
        setShowModal(false);
        setNewEvent({ title: '', description: '', date: '', color: '#F37896' });
        fetchEvents();
      }
    } catch {}
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchEvents();
    } catch {}
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const selectedEvents = selectedDate
    ? events.filter((e) => e.date.split('T')[0] === selectedDate)
    : [];

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const colors = ['#F37896', '#E89349', '#7C9FF5', '#6BC9A6', '#C084FC', '#F472B6'];

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">📅 캘린더</h1>
        <button
          onClick={() => {
            setNewEvent({ ...newEvent, date: selectedDate || todayStr });
            setShowModal(true);
          }}
          className="btn-primary text-sm py-2 px-4"
        >
          + 일정 추가
        </button>
      </div>

      {/* Month Navigation */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">◀</button>
          <h2 className="text-lg font-bold text-gray-700">
            {year}년 {month + 1}월
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">▶</button>
        </div>

        {/* Week Headers */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((d, i) => (
            <div
              key={d}
              className={`text-center text-xs font-medium py-1 ${
                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = getEventsForDay(day);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const dayOfWeek = (firstDayOfWeek + day - 1) % 7;

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                className={`relative p-1 rounded-lg text-sm min-h-[40px] flex flex-col items-center transition-colors ${
                  isSelected
                    ? 'bg-primary-400 text-white'
                    : isToday
                    ? 'bg-primary-50 text-primary-500 font-bold'
                    : dayOfWeek === 0
                    ? 'text-red-400 hover:bg-red-50'
                    : dayOfWeek === 6
                    ? 'text-blue-400 hover:bg-blue-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{day}</span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div
                        key={e._id}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: isSelected ? '#fff' : e.color }}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="card animate-fade-in">
          <h3 className="font-bold text-gray-700 mb-3">
            {selectedDate.replace(/-/g, '.')} 일정
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">등록된 일정이 없어요</p>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map((event) => (
                <div key={event._id} className="flex items-start gap-3">
                  <div className="w-1 h-full min-h-[40px] rounded-full flex-shrink-0" style={{ backgroundColor: event.color }} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-700">{event.title}</p>
                    {event.description && <p className="text-sm text-gray-400">{event.description}</p>}
                    <p className="text-xs text-gray-300 mt-1">{event.createdBy?.nickname}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(event._id)}
                    className="text-gray-300 hover:text-red-400 text-sm p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">일정 추가</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <input
                type="text"
                className="input-field"
                placeholder="일정 제목"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
              <input
                type="text"
                className="input-field"
                placeholder="메모 (선택)"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              />
              <input
                type="date"
                className="input-field"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              />
              <div>
                <p className="text-sm text-gray-500 mb-2">색상</p>
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewEvent({ ...newEvent, color: c })}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        newEvent.color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-300' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <button type="submit" className="btn-primary w-full">추가하기</button>
            </form>
          </div>
        </div>
      )}

      <div className="bottom-nav-spacer" />
    </div>
  );
}
