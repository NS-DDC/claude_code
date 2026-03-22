import { render, screen } from '@testing-library/react';
import GlassCard from '../GlassCard';

describe('GlassCard', () => {
  it('should render children correctly', () => {
    render(
      <GlassCard>
        <div>Test Content</div>
      </GlassCard>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <GlassCard className="custom-class">
        <div>Content</div>
      </GlassCard>
    );

    const glassCard = container.firstChild;
    expect(glassCard).toHaveClass('custom-class');
  });

  it('should render with default hover behavior', () => {
    const { container } = render(
      <GlassCard>
        <div>Content</div>
      </GlassCard>
    );

    const glassCard = container.firstChild;
    expect(glassCard).toBeInTheDocument();
  });

  it('should render without hover when hover is false', () => {
    const { container } = render(
      <GlassCard hover={false}>
        <div>Content</div>
      </GlassCard>
    );

    const glassCard = container.firstChild;
    expect(glassCard).toBeInTheDocument();
  });

  it('should render with glass morphism styles', () => {
    const { container } = render(
      <GlassCard>
        <div>Content</div>
      </GlassCard>
    );

    const glassCard = container.firstChild as HTMLElement;
    expect(glassCard).toHaveClass('bg-white/30');
    expect(glassCard).toHaveClass('backdrop-blur-md');
    expect(glassCard).toHaveClass('rounded-2xl');
    expect(glassCard).toHaveClass('shadow-xl');
  });

  it('should render multiple children', () => {
    render(
      <GlassCard>
        <h1>Title</h1>
        <p>Description</p>
        <button>Action</button>
      </GlassCard>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('should accept complex children structures', () => {
    render(
      <GlassCard>
        <div className="header">
          <h2>Nested Header</h2>
        </div>
        <div className="content">
          <p>Nested Content</p>
        </div>
      </GlassCard>
    );

    expect(screen.getByText('Nested Header')).toBeInTheDocument();
    expect(screen.getByText('Nested Content')).toBeInTheDocument();
  });

  it('should combine custom className with base classes', () => {
    const { container } = render(
      <GlassCard className="my-4 mx-2">
        <div>Content</div>
      </GlassCard>
    );

    const glassCard = container.firstChild as HTMLElement;
    expect(glassCard).toHaveClass('bg-white/30');
    expect(glassCard).toHaveClass('backdrop-blur-md');
    expect(glassCard).toHaveClass('my-4');
    expect(glassCard).toHaveClass('mx-2');
  });

  it('should render with border styling', () => {
    const { container } = render(
      <GlassCard>
        <div>Content</div>
      </GlassCard>
    );

    const glassCard = container.firstChild as HTMLElement;
    expect(glassCard).toHaveClass('border');
    expect(glassCard).toHaveClass('border-white/20');
  });

  it('should render with padding', () => {
    const { container } = render(
      <GlassCard>
        <div>Content</div>
      </GlassCard>
    );

    const glassCard = container.firstChild as HTMLElement;
    expect(glassCard).toHaveClass('p-6');
  });
});
