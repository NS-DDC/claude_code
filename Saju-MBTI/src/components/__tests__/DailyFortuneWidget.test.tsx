import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DailyFortuneWidget from '../DailyFortuneWidget';

// Mock dailyFortune module
jest.mock('@/lib/dailyFortune', () => ({
  getTodayFortune: jest.fn((mbti, element) => ({
    id: 'test-fortune-1',
    date: new Date().toISOString(),
    character: {
      id: 'char-1',
      mbti: mbti,
      element: element,
      category: 'analyst',
      name: '전략적 지혜자',
      emoji: '🦉',
      description: 'Test description',
      strengths: ['분석력', '계획성'],
      weaknesses: ['완벽주의'],
      charmPoints: ['신뢰감'],
      dailyFortuneTemplates: ['좋은 하루'],
    },
    fortuneMessage: '오늘은 새로운 기회가 찾아올 것입니다.',
    luckyTime: '14:00 - 16:00',
    luckyAction: '새로운 도전',
    avoidAction: '과한 걱정',
    compatibleCharacter: {
      id: 'char-2',
      mbti: 'ENTP',
      element: '화',
      category: 'analyst',
      name: '창의적 혁신가',
      emoji: '💡',
      description: 'Test description',
      strengths: ['창의력'],
      weaknesses: ['산만함'],
      charmPoints: ['유머감각'],
      dailyFortuneTemplates: ['즐거운 하루'],
    },
    luckyNumber: 7,
    luckyColor: '파란색',
  })),
}));

describe('DailyFortuneWidget', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should not render when no user data is available', () => {
    const { container } = render(<DailyFortuneWidget />);
    expect(container.firstChild).toBeNull();
  });

  it('should render fortune when user data is available', async () => {
    localStorage.setItem('userMBTI', 'INTJ');
    localStorage.setItem('userElement', '수');

    render(<DailyFortuneWidget />);

    await waitFor(() => {
      expect(screen.getByText('오늘의 운세')).toBeInTheDocument();
    });
  });

  it('should display character emoji and name', async () => {
    localStorage.setItem('userMBTI', 'INTJ');
    localStorage.setItem('userElement', '수');

    render(<DailyFortuneWidget />);

    await waitFor(() => {
      expect(screen.getByText('🦉')).toBeInTheDocument();
      expect(screen.getByText('전략적 지혜자')).toBeInTheDocument();
    });
  });

  it('should display fortune message', async () => {
    localStorage.setItem('userMBTI', 'INTJ');
    localStorage.setItem('userElement', '수');

    render(<DailyFortuneWidget />);

    await waitFor(() => {
      expect(screen.getByText('오늘은 새로운 기회가 찾아올 것입니다.')).toBeInTheDocument();
    });
  });

  it('should display lucky time', async () => {
    localStorage.setItem('userMBTI', 'INTJ');
    localStorage.setItem('userElement', '수');

    render(<DailyFortuneWidget />);

    await waitFor(() => {
      expect(screen.getByText('14:00 - 16:00')).toBeInTheDocument();
      expect(screen.getByText('행운의 시간')).toBeInTheDocument();
    });
  });

  it('should display lucky number', async () => {
    localStorage.setItem('userMBTI', 'INTJ');
    localStorage.setItem('userElement', '수');

    render(<DailyFortuneWidget />);

    await waitFor(() => {
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('행운의 숫자')).toBeInTheDocument();
    });
  });

  it('should display current date', async () => {
    localStorage.setItem('userMBTI', 'INTJ');
    localStorage.setItem('userElement', '수');

    render(<DailyFortuneWidget />);

    await waitFor(() => {
      const dateElements = screen.getAllByText(/\d{4}년/);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  it('should render share button', async () => {
    localStorage.setItem('userMBTI', 'INTJ');
    localStorage.setItem('userElement', '수');

    render(<DailyFortuneWidget />);

    await waitFor(() => {
      const shareButton = screen.getByLabelText('공유하기');
      expect(shareButton).toBeInTheDocument();
    });
  });

  it('should call Share.share when share button is clicked', async () => {
    const { Share } = require('@capacitor/share');
    localStorage.setItem('userMBTI', 'INTJ');
    localStorage.setItem('userElement', '수');

    const user = userEvent.setup();
    render(<DailyFortuneWidget />);

    await waitFor(() => {
      expect(screen.getByLabelText('공유하기')).toBeInTheDocument();
    });

    const shareButton = screen.getByLabelText('공유하기');
    await user.click(shareButton);

    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Fortune & MBTI - 오늘의 운세',
        text: expect.stringContaining('오늘의 운세'),
        dialogTitle: '친구에게 공유하기',
      })
    );
  });

  it('should render link to daily page', async () => {
    localStorage.setItem('userMBTI', 'INTJ');
    localStorage.setItem('userElement', '수');

    render(<DailyFortuneWidget />);

    await waitFor(() => {
      const link = screen.getByText('자세히 보기').closest('a');
      expect(link).toHaveAttribute('href', '/daily');
    });
  });

  it('should handle share error gracefully', async () => {
    const { Share } = require('@capacitor/share');
    Share.share.mockRejectedValueOnce(new Error('Share failed'));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    localStorage.setItem('userMBTI', 'INTJ');
    localStorage.setItem('userElement', '수');

    const user = userEvent.setup();
    render(<DailyFortuneWidget />);

    await waitFor(() => {
      expect(screen.getByLabelText('공유하기')).toBeInTheDocument();
    });

    const shareButton = screen.getByLabelText('공유하기');
    await user.click(shareButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Share failed:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle loading error gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Simulate localStorage error
    jest.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new Error('Storage error');
    });

    const { container } = render(<DailyFortuneWidget />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should apply correct gradient based on element', async () => {
    localStorage.setItem('userMBTI', 'INTJ');
    localStorage.setItem('userElement', '수');

    const { container } = render(<DailyFortuneWidget />);

    await waitFor(() => {
      const gradientElement = container.querySelector('.from-blue-400');
      expect(gradientElement).toBeInTheDocument();
    });
  });

  it('should render with all required styling classes', async () => {
    localStorage.setItem('userMBTI', 'INTJ');
    localStorage.setItem('userElement', '수');

    const { container } = render(<DailyFortuneWidget />);

    await waitFor(() => {
      const card = container.querySelector('.rounded-2xl');
      expect(card).toHaveClass('shadow-xl');
      expect(card).toHaveClass('text-white');
    });
  });

  it('should include share text with all fortune details', async () => {
    const { Share } = require('@capacitor/share');
    localStorage.setItem('userMBTI', 'INTJ');
    localStorage.setItem('userElement', '수');

    const user = userEvent.setup();
    render(<DailyFortuneWidget />);

    await waitFor(() => {
      expect(screen.getByLabelText('공유하기')).toBeInTheDocument();
    });

    const shareButton = screen.getByLabelText('공유하기');
    await user.click(shareButton);

    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('🦉 전략적 지혜자'),
      })
    );

    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('행운의 시간: 14:00 - 16:00'),
      })
    );

    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('행운의 숫자: 7'),
      })
    );
  });
});
