import React from 'react';
import { X, Check, Frown, Inbox } from 'lucide-react';

/**
 * TagBadge Component
 * Displays a pill-shaped badge with color variants based on type
 */
export function TagBadge({ children, variant = 'neutral', className = '' }) {
  const variants = {
    tech: 'tag tag-tech',
    match: 'tag tag-match',
    role: 'tag tag-role',
    neutral: 'tag tag-neutral',
  };

  return (
    <span className={`${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

/**
 * Avatar Component
 * Circular avatar with initials or fallback color
 */
export function Avatar({ 
  name, 
  email, 
  size = 'md', 
  color = 'purple',
  className = '' 
}) {
  const getInitials = () => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return '??';
  };

  const sizes = {
    sm: 'avatar-sm',
    md: '',
    lg: 'avatar-lg',
  };

  const colors = {
    purple: 'avatar-purple',
    green: 'avatar-green',
    orange: 'avatar-orange',
    gray: 'avatar-gray',
  };

  return (
    <div className={`avatar ${sizes[size]} ${colors[color]} ${className}`}>
      {getInitials()}
    </div>
  );
}

/**
 * MatchScore Component
 * Displays percentage with color-coded progress bar
 */
export function MatchScore({ score, showLabel = true, className = '' }) {
  const percentage = Math.round(score * 100);
  
  let colorClass = 'score-low';
  if (percentage >= 70) colorClass = 'score-high';
  else if (percentage >= 40) colorClass = 'score-mid';

  let textColor = 'var(--color-text-tertiary)';
  if (percentage >= 70) textColor = 'var(--color-success)';
  else if (percentage >= 40) textColor = 'var(--color-warning)';

  return (
    <div className={`text-right ${className}`}>
      {showLabel && (
        <div 
          className="text-body font-semibold"
          style={{ color: textColor, fontSize: '15px' }}
        >
          {percentage}%
        </div>
      )}
      <div className="score-bar" style={{ width: showLabel ? '60px' : '100%' }}>
        <div 
          className={`score-fill ${colorClass}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * TimeSlot Component
 * Displays a clickable time slot chip
 */
export function TimeSlot({ 
  time, 
  gmt, 
  ist, 
  selected, 
  overlap,
  onClick,
  disabled = false 
}) {
  let className = 'slot-chip';
  if (selected) className = 'slot-chip slot-chip-selected';
  else if (overlap) className = 'slot-chip slot-chip-overlap';

  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
    >
      <div style={{ fontWeight: 500 }}>{gmt}</div>
      {ist && (
        <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>
          IST: {ist}
        </div>
      )}
    </button>
  );
}

/**
 * UserChip Component
 * Compact avatar + name + email for inline display
 */
export function UserChip({ user, onRemove, className = '' }) {
  return (
    <div className={`flex items-center gap-2 p-2 bg-[var(--color-border-light)] rounded-lg ${className}`}>
      <Avatar name={user.name} email={user.email} size="sm" color="purple" />
      <div className="flex-1 min-w-0">
        <div className="text-label" style={{ color: 'var(--color-text-primary)' }}>
          {user.name}
        </div>
        <div className="text-mono" style={{ color: 'var(--color-text-tertiary)', fontSize: '10px' }}>
          {user.email}
        </div>
      </div>
      {onRemove && (
        <button 
          className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
          onClick={onRemove}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/**
 * CallTypeCard Component
 * Card for selecting call type with icon, name, description
 */
export function CallTypeCard({ 
  icon, 
  label, 
  description, 
  idealMentor,
  selected, 
  onClick 
}) {
  return (
    <div
      className="card cursor-pointer"
      onClick={onClick}
      style={{
        borderColor: selected ? 'var(--color-accent)' : 'var(--color-border)',
        background: selected ? 'var(--color-accent-dim)' : 'var(--color-card)',
        padding: '12px',
        borderRadius: '10px',
      }}
    >
      <div style={{ fontSize: '18px', marginBottom: '6px' }}>{icon}</div>
      <div 
        className="text-label"
        style={{ 
          color: selected ? 'var(--tag-tech-text)' : 'var(--color-text-primary)',
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div 
        className="text-mono"
        style={{ 
          color: selected ? 'var(--tag-tech-text)' : 'var(--color-text-secondary)',
          fontSize: '11px',
          marginTop: '2px',
        }}
      >
        {idealMentor}
      </div>
    </div>
  );
}

/**
 * StepWizard Component
 * Vertical stepper with done/active/todo states
 */
export function StepWizard({ steps, currentStep, className = '' }) {
  return (
    <div className={className}>
      {steps.map((step, index) => {
        let state = 'todo';
        if (index < currentStep) state = 'done';
        else if (index === currentStep) state = 'active';

        return (
          <div key={step.id} className="flex gap-3 mb-1">
            <div className="flex flex-col items-center flex-shrink-0" style={{ width: '22px' }}>
              <div
                className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
                style={{
                  background: state === 'done' ? 'var(--color-success)' 
                    : state === 'active' ? 'var(--color-accent)' 
                    : 'var(--color-border-light)',
                  color: state === 'todo' ? 'var(--color-text-tertiary)' : '#fff',
                }}
              >
                {state === 'done' ? <Check size={12} strokeWidth={3} /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div 
                  className="w-[1px]"
                  style={{ 
                    flex: 1,
                    minHeight: '20px',
                    margin: '4px 0',
                    background: state === 'done' ? 'var(--color-success)' : 'var(--color-border)',
                  }}
                />
              )}
            </div>
            <div className="flex-1 pb-6">
              <div 
                className="text-label"
                style={{ 
                  color: state === 'todo' ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                  fontWeight: state === 'active' ? 600 : 500,
                  marginBottom: '8px',
                  marginTop: '2px',
                }}
              >
                {step.label}
              </div>
              {step.content && (
                <div className="animate-fade-in mt-2">
                  {step.content}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * MentorCard Component
 * Full mentor card with avatar, name, role, tags, match %, reason, slots
 */
export function MentorCard({ 
  mentor, 
  selected, 
  onClick,
  showSlots = false,
  isLoadingSlots = false,
  slots = [],
  onSlotSelect,
  selectedSlot,
  onBook,
  booking = false
}) {
  const percentage = Math.round((mentor.similarityScore || 0) * 100);
  
  return (
    <div 
      className={`card mb-2.5 cursor-pointer ${selected ? 'card-selected' : ''}`}
      onClick={onClick}
      style={{ padding: '14px' }}
    >
      {/* Top: Avatar + Info + Score */}
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex gap-2.5 items-center">
          <Avatar 
            name={mentor.name} 
            email={mentor.email} 
            color={percentage >= 70 ? 'green' : percentage >= 40 ? 'orange' : 'purple'} 
          />
          <div>
            <div 
              className="text-label" 
              style={{ 
                fontWeight: 500,
                color: 'var(--color-text-primary)',
              }}
            >
              {mentor.name}
            </div>
            <div 
              className="text-mono" 
              style={{ 
                color: 'var(--color-text-secondary)', 
                fontSize: '11px',
              }}
            >
              {mentor.description?.split('. ')[0] || 'Mentor'}
            </div>
          </div>
        </div>
        <MatchScore score={mentor.similarityScore || 0} />
      </div>

      {/* Tags */}
      {mentor.tags && mentor.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {mentor.tags.slice(0, 4).map((tag, i) => (
            <TagBadge key={i} variant="tech">{tag}</TagBadge>
          ))}
        </div>
      )}

      {/* Match Reason */}
      {mentor.matchReason && (
        <div 
          className="text-mono mb-2.5"
          style={{ 
            color: 'var(--color-text-secondary)', 
            fontSize: '11px', 
            lineHeight: '1.5',
          }}
        >
          {mentor.matchReason}
        </div>
      )}

      {/* Overlapping Slots (shown when selected) */}
      {showSlots && (
        <div 
          className="pt-2.5 mt-2.5 border-t"
          style={{ borderColor: 'var(--color-border-light)' }}
        >
          <div 
            className="text-caption mb-2"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Overlapping slots
          </div>
          
          {isLoadingSlots ? (
            <div className="flex items-center gap-2 py-4">
              <div className="spinner" />
              <span 
                className="text-mono" 
                style={{ 
                  color: 'var(--color-text-secondary)', 
                  fontSize: '11px',
                }}
              >
                Finding matching availability...
              </span>
            </div>
          ) : slots.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {slots.slice(0, 8).map((slot, idx) => {
                  const slotDate = new Date(slot.startTime);
                  const gmt = slotDate.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'UTC'
                  });
                  const ist = slotDate.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'Asia/Kolkata'
                  });
                  
                  return (
                    <TimeSlot
                      key={idx}
                      gmt={gmt}
                      ist={ist}
                      overlap={true}
                      selected={selectedSlot === slot}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSlotSelect(slot);
                      }}
                    />
                  );
                })}
              </div>
              
              {selectedSlot && (
                <button
                  className="btn btn-primary w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBook();
                  }}
                  disabled={booking}
                  style={{ padding: '9px', fontSize: '13px' }}
                >
                  {booking ? 'Booking...' : 'Book slot'}
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <div style={{ marginBottom: '8px' }}><Frown size={24} className="mx-auto" /></div>
              <div 
                className="text-mono" 
                style={{ 
                  color: 'var(--color-text-secondary)', 
                  fontSize: '11px',
                }}
              >
                No overlapping availability found
              </div>
            </div>
          )}
        </div>
      )}

      {/* Select to see slots (when not selected) */}
      {!showSlots && (
        <button
          className="btn btn-secondary w-full mt-2.5"
          disabled
          style={{ fontSize: '12px', cursor: 'not-allowed' }}
        >
          Select to see slots
        </button>
      )}
    </div>
  );
}

/**
 * LoadingState Component
 */
export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="spinner mb-3" />
      <div className="text-mono" style={{ color: 'var(--color-text-secondary)' }}>
        {message}
      </div>
    </div>
  );
}

/**
 * EmptyState Component
 */
export function EmptyState({ icon = <Inbox size={48} />, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <div className="text-heading mb-1" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </div>
      <div className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
        {description}
      </div>
    </div>
  );
}
