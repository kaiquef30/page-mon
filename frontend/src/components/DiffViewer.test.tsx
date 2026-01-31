import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiffViewer } from './DiffViewer';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

const sampleDiff = `diff --git a/file.txt b/file.txt
index 1234567..abcdefg 100644
--- a/file.txt
+++ b/file.txt
@@ -1,3 +1,4 @@
 This is line 1
-This is line 2
+This is modified line 2
+This is a new line 3
 This is line 4`;

const simpleDiff = `@@ -1,3 +1,4 @@
 unchanged line
-removed line
+added line
 another unchanged`;

function renderWithProviders(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

describe('DiffViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render diff content', () => {
      renderWithProviders(<DiffViewer diff={sampleDiff} />);

      expect(screen.getByText('This is line 1')).toBeInTheDocument();
      expect(screen.getByText('This is modified line 2')).toBeInTheDocument();
      expect(screen.getByText('This is a new line 3')).toBeInTheDocument();
    });

    it('should display stats correctly', () => {
      renderWithProviders(<DiffViewer diff={simpleDiff} />);

      expect(screen.getByText(/\+1/)).toBeInTheDocument();
      expect(screen.getByText(/-1/)).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = renderWithProviders(
        <DiffViewer diff={sampleDiff} className="custom-class" />
      );

      const diffContainer = container.querySelector('.custom-class');
      expect(diffContainer).toBeInTheDocument();
    });

    it('should handle empty diff', () => {
      renderWithProviders(<DiffViewer diff="" />);

      const stats = screen.getByText(/\+0/);
      expect(stats).toBeInTheDocument();
    });

    it('should parse and display added lines correctly', () => {
      const { container } = renderWithProviders(<DiffViewer diff={simpleDiff} />);

      const addedLines = container.querySelectorAll('.diff-added');
      expect(addedLines.length).toBeGreaterThan(0);
    });

    it('should parse and display removed lines correctly', () => {
      const { container } = renderWithProviders(<DiffViewer diff={simpleDiff} />);

      const removedLines = container.querySelectorAll('.diff-removed');
      expect(removedLines.length).toBeGreaterThan(0);
    });

    it('should display line numbers for added and context lines', () => {
      renderWithProviders(<DiffViewer diff={simpleDiff} />);

      const container = screen.getByText('unchanged line').closest('div');
      expect(container?.querySelector('span')?.textContent).toBeTruthy();
    });
  });

  describe('search functionality', () => {
    it('should render search input', () => {
      renderWithProviders(<DiffViewer diff={sampleDiff} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should filter lines based on search query', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DiffViewer diff={sampleDiff} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'modified');

      await waitFor(() => {
        expect(screen.getByText('1/1')).toBeInTheDocument();
      });
    });

    it('should highlight search matches', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DiffViewer diff={sampleDiff} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'line');

      await waitFor(() => {
        const marks = screen.getAllByText('line');
        expect(marks.length).toBeGreaterThan(0);
      });
    });

    it('should show match counter when there are matches', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DiffViewer diff={sampleDiff} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'line');

      await waitFor(() => {
        const counter = screen.getByText(/\/\d+/);
        expect(counter).toBeInTheDocument();
      });
    });

    it('should not show navigation when no matches', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DiffViewer diff={sampleDiff} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.queryByText(/\/\d+/)).not.toBeInTheDocument();
      });
    });

    it('should handle case-insensitive search', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DiffViewer diff={sampleDiff} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'LINE');

      await waitFor(() => {
        const counter = screen.queryByText(/\/\d+/);
        expect(counter).toBeInTheDocument();
      });
    });

    it('should escape regex special characters in search', async () => {
      const user = userEvent.setup();
      const diffWithSpecialChars = `@@ -1,1 +1,1 @@
+function test() { return true; }`;

      renderWithProviders(<DiffViewer diff={diffWithSpecialChars} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, '()');

      await waitFor(() => {
        const counter = screen.queryByText(/1\/1/);
        expect(counter).toBeInTheDocument();
      });
    });
  });

  describe('match navigation', () => {
    it('should navigate to next match', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DiffViewer diff={sampleDiff} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'line');

      await waitFor(() => {
        expect(screen.getByText(/1\/\d+/)).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: '' }).parentElement?.querySelector('[class*="ChevronDown"]')?.closest('button');
      if (nextButton) {
        await user.click(nextButton);
      }

      await waitFor(() => {
        expect(screen.getByText(/2\/\d+/)).toBeInTheDocument();
      });
    });

    it('should navigate to previous match', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DiffViewer diff={sampleDiff} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'line');

      await waitFor(() => {
        expect(screen.getByText(/1\/\d+/)).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const prevButton = buttons.find(btn => btn.querySelector('[class*="ChevronUp"]'));

      if (prevButton) {
        await user.click(prevButton);
      }

      await waitFor(() => {
        const counter = screen.queryByText(/\/\d+/);
        expect(counter).toBeInTheDocument();
      });
    });

    it('should cycle through matches', async () => {
      const user = userEvent.setup();
      const multiMatchDiff = `@@ -1,3 +1,3 @@
+test line 1
+test line 2
+test line 3`;

      renderWithProviders(<DiffViewer diff={multiMatchDiff} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'test');

      await waitFor(() => {
        expect(screen.getByText('1/3')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(btn => btn.querySelector('[class*="ChevronDown"]'));

      if (nextButton) {
        await user.click(nextButton);
        await waitFor(() => expect(screen.getByText('2/3')).toBeInTheDocument());

        await user.click(nextButton);
        await waitFor(() => expect(screen.getByText('3/3')).toBeInTheDocument());

        await user.click(nextButton);
        await waitFor(() => expect(screen.getByText('1/3')).toBeInTheDocument());
      }
    });

    it('should reset to first match when search query changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DiffViewer diff={sampleDiff} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'line');

      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(btn => btn.querySelector('[class*="ChevronDown"]'));

      if (nextButton) {
        await user.click(nextButton);
        await waitFor(() => expect(screen.getByText(/2\/\d+/)).toBeInTheDocument());
      }

      await user.clear(searchInput);
      await user.type(searchInput, 'This');

      await waitFor(() => {
        expect(screen.getByText(/1\/\d+/)).toBeInTheDocument();
      });
    });
  });

  describe('copy to clipboard', () => {
    it('should copy diff to clipboard', async () => {
      const user = userEvent.setup();
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock },
      });

      renderWithProviders(<DiffViewer diff={sampleDiff} />);

      const buttons = screen.getAllByRole('button');
      const copyButton = buttons.find(btn => btn.querySelector('[class*="Copy"]'));

      expect(copyButton).toBeInTheDocument();

      if (copyButton) {
        await user.click(copyButton);
      }

      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith(sampleDiff);
        expect(toast.success).toHaveBeenCalledWith('Diff copied to clipboard');
      });
    });

    it('should handle clipboard API errors gracefully', async () => {
      const user = userEvent.setup();
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard error'));
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock },
      });

      renderWithProviders(<DiffViewer diff={sampleDiff} />);

      const buttons = screen.getAllByRole('button');
      const copyButton = buttons.find(btn => btn.querySelector('[class*="Copy"]'));

      if (copyButton) {
        await expect(async () => {
          await user.click(copyButton);
        }).rejects.toThrow();
      }
    });
  });

  describe('download functionality', () => {
    it('should download diff as file', async () => {
      const user = userEvent.setup();
      const createElementSpy = vi.spyOn(document, 'createElement');
      const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
      const revokeObjectURLMock = vi.fn();

      global.URL.createObjectURL = createObjectURLMock;
      global.URL.revokeObjectURL = revokeObjectURLMock;

      renderWithProviders(<DiffViewer diff={sampleDiff} />);

      const buttons = screen.getAllByRole('button');
      const downloadButton = buttons.find(btn => btn.querySelector('[class*="Download"]'));

      expect(downloadButton).toBeInTheDocument();

      if (downloadButton) {
        await user.click(downloadButton);
      }

      await waitFor(() => {
        expect(createElementSpy).toHaveBeenCalledWith('a');
        expect(createObjectURLMock).toHaveBeenCalled();
        expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
        expect(toast.success).toHaveBeenCalledWith('Diff downloaded');
      });

      createElementSpy.mockRestore();
    });

    it('should create blob with correct content', async () => {
      const user = userEvent.setup();
      const blobSpy = vi.spyOn(global, 'Blob');

      renderWithProviders(<DiffViewer diff={sampleDiff} />);

      const buttons = screen.getAllByRole('button');
      const downloadButton = buttons.find(btn => btn.querySelector('[class*="Download"]'));

      if (downloadButton) {
        await user.click(downloadButton);
      }

      await waitFor(() => {
        expect(blobSpy).toHaveBeenCalledWith([sampleDiff], { type: 'text/plain' });
      });

      blobSpy.mockRestore();
    });
  });

  describe('fullscreen toggle', () => {
    it('should toggle fullscreen mode', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DiffViewer diff={sampleDiff} />);

      const buttons = screen.getAllByRole('button');
      const fullscreenButton = buttons.find(btn => btn.querySelector('[class*="Maximize2"]'));

      expect(fullscreenButton).toBeInTheDocument();

      if (fullscreenButton) {
        await user.click(fullscreenButton);
      }

      await waitFor(() => {
        const exitButton = screen.getAllByRole('button').find(btn => btn.querySelector('[class*="X"]'));
        expect(exitButton).toBeInTheDocument();
      });
    });

    it('should exit fullscreen mode', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DiffViewer diff={sampleDiff} />);

      const buttons = screen.getAllByRole('button');
      const fullscreenButton = buttons.find(btn => btn.querySelector('[class*="Maximize2"]'));

      if (fullscreenButton) {
        await user.click(fullscreenButton);

        await waitFor(() => {
          const exitButton = screen.getAllByRole('button').find(btn => btn.querySelector('[class*="X"]'));
          expect(exitButton).toBeInTheDocument();
          return exitButton;
        }).then(async (exitButton) => {
          if (exitButton) {
            await user.click(exitButton);
          }
        });

        await waitFor(() => {
          const maximizeButton = screen.getAllByRole('button').find(btn => btn.querySelector('[class*="Maximize2"]'));
          expect(maximizeButton).toBeInTheDocument();
        });
      }
    });

    it('should apply fullscreen container class', async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<DiffViewer diff={sampleDiff} />);

      const buttons = screen.getAllByRole('button');
      const fullscreenButton = buttons.find(btn => btn.querySelector('[class*="Maximize2"]'));

      if (fullscreenButton) {
        await user.click(fullscreenButton);
      }

      await waitFor(() => {
        const fullscreenContainer = container.querySelector('.fixed.inset-0.z-50');
        expect(fullscreenContainer).toBeInTheDocument();
      });
    });
  });

  describe('wrap lines toggle', () => {
    it('should toggle line wrapping', async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<DiffViewer diff={sampleDiff} />);

      const buttons = screen.getAllByRole('button');
      const wrapButton = buttons.find(btn => btn.querySelector('[class*="WrapText"]'));

      expect(wrapButton).toBeInTheDocument();

      if (wrapButton) {
        await user.click(wrapButton);
      }

      await waitFor(() => {
        const wrappedPre = container.querySelector('.whitespace-pre-wrap');
        expect(wrappedPre).toBeInTheDocument();
      });
    });

    it('should toggle off line wrapping', async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<DiffViewer diff={sampleDiff} />);

      const buttons = screen.getAllByRole('button');
      const wrapButton = buttons.find(btn => btn.querySelector('[class*="WrapText"]'));

      if (wrapButton) {
        await user.click(wrapButton);

        await waitFor(() => {
          const wrappedPre = container.querySelector('.whitespace-pre-wrap');
          expect(wrappedPre).toBeInTheDocument();
        });

        await user.click(wrapButton);

        await waitFor(() => {
          const normalPre = container.querySelector('.whitespace-pre');
          expect(normalPre).toBeInTheDocument();
        });
      }
    });

    it('should apply active state when wrap is enabled', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DiffViewer diff={sampleDiff} />);

      const buttons = screen.getAllByRole('button');
      const wrapButton = buttons.find(btn => btn.querySelector('[class*="WrapText"]'));

      if (wrapButton) {
        await user.click(wrapButton);

        await waitFor(() => {
          expect(wrapButton).toHaveClass(/bg-accent/);
        });
      }
    });
  });

  describe('show whitespace toggle', () => {
    it('should toggle whitespace visibility', async () => {
      const user = userEvent.setup();
      const diffWithSpaces = `@@ -1,1 +1,1 @@
+line with spaces and\ttabs`;

      renderWithProviders(<DiffViewer diff={diffWithSpaces} />);

      const buttons = screen.getAllByRole('button');
      const whitespaceButton = buttons.find(btn => btn.querySelector('[class*="Eye"]'));

      expect(whitespaceButton).toBeInTheDocument();

      if (whitespaceButton) {
        await user.click(whitespaceButton);
      }

      await waitFor(() => {
        expect(screen.getByText(/·/)).toBeInTheDocument();
      });
    });

    it('should replace spaces with dots', async () => {
      const user = userEvent.setup();
      const diffWithSpaces = `@@ -1,1 +1,1 @@
+hello world`;

      renderWithProviders(<DiffViewer diff={diffWithSpaces} />);

      const buttons = screen.getAllByRole('button');
      const whitespaceButton = buttons.find(btn => btn.querySelector('[class*="Eye"]'));

      if (whitespaceButton) {
        await user.click(whitespaceButton);

        await waitFor(() => {
          expect(screen.getByText(/hello·world/)).toBeInTheDocument();
        });
      }
    });

    it('should replace tabs with arrows', async () => {
      const user = userEvent.setup();
      const diffWithTabs = `@@ -1,1 +1,1 @@
+hello\tworld`;

      renderWithProviders(<DiffViewer diff={diffWithTabs} />);

      const buttons = screen.getAllByRole('button');
      const whitespaceButton = buttons.find(btn => btn.querySelector('[class*="Eye"]'));

      if (whitespaceButton) {
        await user.click(whitespaceButton);

        await waitFor(() => {
          expect(screen.getByText(/→/)).toBeInTheDocument();
        });
      }
    });

    it('should apply active state when whitespace is shown', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DiffViewer diff={sampleDiff} />);

      const buttons = screen.getAllByRole('button');
      const whitespaceButton = buttons.find(btn => btn.querySelector('[class*="Eye"]'));

      if (whitespaceButton) {
        await user.click(whitespaceButton);

        await waitFor(() => {
          expect(whitespaceButton).toHaveClass(/bg-accent/);
        });
      }
    });
  });

  describe('edge cases', () => {
    it('should handle diff with only headers', () => {
      const headerOnlyDiff = `diff --git a/file.txt b/file.txt
index 1234567..abcdefg 100644
--- a/file.txt
+++ b/file.txt`;

      renderWithProviders(<DiffViewer diff={headerOnlyDiff} />);

      expect(screen.getByText(/\+0/)).toBeInTheDocument();
      expect(screen.getByText(/-0/)).toBeInTheDocument();
    });

    it('should handle very long lines', () => {
      const longLine = 'a'.repeat(1000);
      const diffWithLongLine = `@@ -1,1 +1,1 @@
+${longLine}`;

      renderWithProviders(<DiffViewer diff={diffWithLongLine} />);

      expect(screen.getByText(longLine)).toBeInTheDocument();
    });

    it('should handle multiple file diff', () => {
      const multiFileDiff = `diff --git a/file1.txt b/file1.txt
+++ b/file1.txt
@@ -1,1 +1,1 @@
+change in file 1
diff --git a/file2.txt b/file2.txt
+++ b/file2.txt
@@ -1,1 +1,1 @@
+change in file 2`;

      renderWithProviders(<DiffViewer diff={multiFileDiff} />);

      expect(screen.getByText('change in file 1')).toBeInTheDocument();
      expect(screen.getByText('change in file 2')).toBeInTheDocument();
    });

    it('should handle diff with special characters', () => {
      const specialCharDiff = `@@ -1,1 +1,1 @@
+<script>alert('test')</script>`;

      renderWithProviders(<DiffViewer diff={specialCharDiff} />);

      expect(screen.getByText(/<script>alert\('test'\)<\/script>/)).toBeInTheDocument();
    });

    it('should respect custom maxHeight', () => {
      const { container } = renderWithProviders(
        <DiffViewer diff={sampleDiff} maxHeight="300px" />
      );

      const scrollArea = container.querySelector('[style*="max-height"]');
      expect(scrollArea).toHaveStyle({ maxHeight: '300px' });
    });
  });
});
