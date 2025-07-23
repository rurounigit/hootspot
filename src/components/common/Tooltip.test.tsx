import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Tooltip from './Tooltip';

describe('Tooltip', () => {
  const user = userEvent.setup();

  it('renders the child element', () => {
    render(
      <Tooltip content="Test tooltip">
        <span>Hover me</span>
      </Tooltip>
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('displays the tooltip on mouse enter', async () => {
    render(
      <Tooltip content="Test tooltip">
        <span>Hover me</span>
      </Tooltip>
    );

    const childElement = screen.getByText('Hover me');
    await user.hover(childElement);

    expect(screen.getByText('Test tooltip')).toBeInTheDocument();
  });

  it('hides the tooltip on mouse leave', async () => {
    render(
      <Tooltip content="Test tooltip">
        <span>Hover me</span>
      </Tooltip>
    );

    const childElement = screen.getByText('Hover me');
    await user.hover(childElement);
    await user.unhover(childElement);

    expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
  });
});
