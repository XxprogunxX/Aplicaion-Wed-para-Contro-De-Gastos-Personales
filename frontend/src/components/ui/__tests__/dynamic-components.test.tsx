import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Accordion from '@/components/ui/Accordion';
import InteractiveList from '@/components/ui/InteractiveList';
import Menu from '@/components/ui/Menu';
import Modal from '@/components/ui/Modal';
import Tabs from '@/components/ui/Tabs';

function ModalHarness() {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir modal
      </button>
      <Modal title="Modal de prueba" isOpen={open} onClose={() => setOpen(false)}>
        <button type="button">Boton interno</button>
      </Modal>
    </div>
  );
}

describe('Componentes dinamicos accesibles', () => {
  it('renderiza el modal con rol y restaura el foco', async () => {
    const user = userEvent.setup();
    render(<ModalHarness />);

    const trigger = screen.getByRole('button', { name: 'Abrir modal' });
    trigger.focus();
    await act(async () => {
      await user.click(trigger);
    });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Cerrar modal' })).toHaveFocus();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Cerrar modal' }));
    });
    expect(trigger).toHaveFocus();
  });

  it('controla el menu con roles ARIA y foco inicial', async () => {
    const user = userEvent.setup();
    render(
      <Menu
        label="Acciones"
        items={[
          { id: 'uno', label: 'Nueva', onSelect: () => {} },
          { id: 'dos', label: 'Editar', onSelect: () => {} },
        ]}
      />
    );

    const trigger = screen.getByRole('button', { name: 'Acciones' });
    await act(async () => {
      await user.click(trigger);
    });

    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Nueva' })).toHaveFocus();

    await act(async () => {
      await user.keyboard('{Escape}');
    });
    expect(trigger).toHaveFocus();
  });

  it('cambia tabs y paneles correctamente', async () => {
    const user = userEvent.setup();
    render(
      <Tabs
        items={[
          { id: 'uno', label: 'Uno', content: 'Contenido uno' },
          { id: 'dos', label: 'Dos', content: 'Contenido dos' },
        ]}
      />
    );

    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();

    const tabDos = screen.getByRole('tab', { name: 'Dos' });
    await act(async () => {
      await user.click(tabDos);
    });

    expect(tabDos).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Dos' })).toBeVisible();
  });

  it('expande y colapsa el acordeon con roles', async () => {
    const user = userEvent.setup();
    render(
      <Accordion
        items={[
          { id: 'uno', title: 'Seccion uno', content: 'Detalle uno' },
          { id: 'dos', title: 'Seccion dos', content: 'Detalle dos' },
        ]}
      />
    );

    const trigger = screen.getByRole('button', { name: /Seccion uno/ });
    await act(async () => {
      await user.click(trigger);
    });

    const region = screen.getByRole('region', { name: /Seccion uno/ });
    expect(region).toBeVisible();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('actualiza la lista con DOM dinamico y mantiene el foco', async () => {
    const user = userEvent.setup();
    render(<InteractiveList />);

    const input = screen.getByLabelText('Nueva categoria');
    await act(async () => {
      await user.type(input, 'Salud');
      await user.click(screen.getByRole('button', { name: 'Agregar' }));
    });

    const items = await screen.findAllByRole('listitem');
    expect(items[items.length - 1]).toHaveTextContent('Salud');
    expect(input).toHaveFocus();
  });
});
