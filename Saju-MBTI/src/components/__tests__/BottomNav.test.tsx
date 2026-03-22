import { render, screen } from '@testing-library/react';
import BottomNav from '../BottomNav';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}));

describe('BottomNav', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all navigation items', () => {
    render(<BottomNav />);

    expect(screen.getByText('홈')).toBeInTheDocument();
    expect(screen.getByText('사주')).toBeInTheDocument();
    expect(screen.getByText('MBTI')).toBeInTheDocument();
    expect(screen.getByText('운명')).toBeInTheDocument();
    expect(screen.getByText('설정')).toBeInTheDocument();
    expect(screen.getByText('프로필')).toBeInTheDocument();
  });

  it('should highlight active route', () => {
    const usePathname = require('next/navigation').usePathname;
    usePathname.mockReturnValue('/');

    render(<BottomNav />);

    const homeLink = screen.getByText('홈').closest('a');
    expect(homeLink).toBeInTheDocument();
  });

  it('should render correct links for all items', () => {
    render(<BottomNav />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(6);

    expect(links[0]).toHaveAttribute('href', '/');
    expect(links[1]).toHaveAttribute('href', '/saju');
    expect(links[2]).toHaveAttribute('href', '/mbti');
    expect(links[3]).toHaveAttribute('href', '/destiny');
    expect(links[4]).toHaveAttribute('href', '/settings');
    expect(links[5]).toHaveAttribute('href', '/profile');
  });

  it('should apply active styling to home route', () => {
    const usePathname = require('next/navigation').usePathname;
    usePathname.mockReturnValue('/');

    const { container } = render(<BottomNav />);

    const homeText = screen.getByText('홈');
    expect(homeText).toHaveClass('text-royal-gold');
    expect(homeText).toHaveClass('font-semibold');
  });

  it('should apply active styling to saju route', () => {
    const usePathname = require('next/navigation').usePathname;
    usePathname.mockReturnValue('/saju');

    render(<BottomNav />);

    const sajuText = screen.getByText('사주');
    expect(sajuText).toHaveClass('text-royal-gold');
    expect(sajuText).toHaveClass('font-semibold');
  });

  it('should apply inactive styling to non-active routes', () => {
    const usePathname = require('next/navigation').usePathname;
    usePathname.mockReturnValue('/');

    render(<BottomNav />);

    const sajuText = screen.getByText('사주');
    expect(sajuText).toHaveClass('text-pastel-brown');
    expect(sajuText).not.toHaveClass('font-semibold');
  });

  it('should render with fixed positioning', () => {
    const { container } = render(<BottomNav />);

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('fixed');
    expect(nav).toHaveClass('bottom-0');
    expect(nav).toHaveClass('left-0');
    expect(nav).toHaveClass('right-0');
  });

  it('should render with backdrop blur', () => {
    const { container } = render(<BottomNav />);

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('bg-white/40');
    expect(nav).toHaveClass('backdrop-blur-lg');
  });

  it('should render with proper z-index', () => {
    const { container } = render(<BottomNav />);

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('z-50');
  });

  it('should render all icons', () => {
    const { container } = render(<BottomNav />);

    // Each nav item should have an icon (SVG element)
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThanOrEqual(6);
  });

  it('should handle multiple route changes', () => {
    const usePathname = require('next/navigation').usePathname;

    // First render with home
    usePathname.mockReturnValue('/');
    const { rerender } = render(<BottomNav />);
    expect(screen.getByText('홈')).toHaveClass('text-royal-gold');

    // Change to saju
    usePathname.mockReturnValue('/saju');
    rerender(<BottomNav />);
    expect(screen.getByText('사주')).toHaveClass('text-royal-gold');

    // Change to mbti
    usePathname.mockReturnValue('/mbti');
    rerender(<BottomNav />);
    expect(screen.getByText('MBTI')).toHaveClass('text-royal-gold');
  });

  it('should render within max-width container', () => {
    const { container } = render(<BottomNav />);

    const innerContainer = container.querySelector('.max-w-lg');
    expect(innerContainer).toBeInTheDocument();
  });

  it('should have safe area padding', () => {
    const { container } = render(<BottomNav />);

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('pb-safe');
  });
});
