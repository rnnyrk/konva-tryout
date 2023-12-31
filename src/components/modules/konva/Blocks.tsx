import { KonvaEventObject } from 'konva/lib/Node';
import { Group, Rect, Text } from 'react-konva';

import { useBlocks, useBoardStore } from 'store/board';
import { getTheme } from 'utils';
import { BLOCK_HEIGHT, BLOCK_SIZE, BLOCK_WIDTH, STAGE_HEIGHT, STAGE_WIDTH } from 'utils/constants';

import { useKonvaContext } from './KonvaContext';

const theme = getTheme();

export function Blocks() {
  const { stageRef, shadowRef, selected, setSelected } = useKonvaContext()!;

  const blocks = useBlocks();
  const { currentLayerIndex, layers, setLayers } = useBoardStore();

  function onActivate(index: number) {
    if (selected === index) {
      setSelected(null);
      return;
    }

    setSelected(index);
  }

  function onDragStart(event: KonvaEventObject<DragEvent>) {
    if (!shadowRef.current || !stageRef.current) return;

    shadowRef.current.show();
    shadowRef.current.moveToTop();
    event.target.moveToTop();
  }

  function onDragEnd(event: KonvaEventObject<DragEvent>) {
    if (!shadowRef.current || !stageRef.current) return;

    const el = event.target;
    const elId = Number(el.attrs.id.split('-')[1]);

    const xPos = Math.round(el.x() / BLOCK_SIZE) * BLOCK_SIZE;
    const yPos = Math.round(el.y() / BLOCK_SIZE) * BLOCK_SIZE;

    el.position({
      x: xPos,
      y: yPos,
    });

    // Update position of the block in store after dragging
    const newBlocks = [...blocks];
    newBlocks[elId] = {
      ...newBlocks[elId],
      x: xPos,
      y: yPos,
    };

    const newLayers = [...layers];
    newLayers[currentLayerIndex].blocks = newBlocks;
    setLayers(newLayers);

    stageRef.current.batchDraw();
    shadowRef.current.hide();
  }

  function onDragMove(event: KonvaEventObject<DragEvent>) {
    if (!shadowRef.current || !stageRef.current) return;

    // Position current element within bounding box of Pallet (stage)
    const el = event.target;
    const pos = el.getAbsolutePosition();

    const elId = Number(el.attrs.id.split('-')[1]);
    const isRotatedEl = blocks[elId].rotated;

    // Depending on the rotation, the bounding box is different
    let xPos = pos.x;
    if (xPos < 0) xPos = 0;
    if (!isRotatedEl && xPos > STAGE_WIDTH - BLOCK_WIDTH) {
      xPos = STAGE_WIDTH - BLOCK_WIDTH;
    } else if (isRotatedEl && xPos > STAGE_WIDTH - BLOCK_HEIGHT) {
      xPos = STAGE_WIDTH - BLOCK_HEIGHT;
    }

    let yPos = pos.y;
    if (yPos < 0) yPos = 0;
    if (!isRotatedEl && yPos > STAGE_HEIGHT - BLOCK_HEIGHT) {
      yPos = STAGE_HEIGHT - BLOCK_HEIGHT;
    } else if (isRotatedEl && yPos > STAGE_HEIGHT - BLOCK_WIDTH) {
      yPos = STAGE_HEIGHT - BLOCK_WIDTH;
    }

    el.setAbsolutePosition({
      x: xPos,
      y: yPos,
    });

    // Match shadow element relative to the current element
    shadowRef.current.width(isRotatedEl ? BLOCK_HEIGHT : BLOCK_WIDTH);
    shadowRef.current.height(isRotatedEl ? BLOCK_WIDTH : BLOCK_HEIGHT);
    shadowRef.current.position({
      x: Math.round(xPos / BLOCK_SIZE) * BLOCK_SIZE,
      y: Math.round(yPos / BLOCK_SIZE) * BLOCK_SIZE,
    });

    stageRef.current.batchDraw();
  }

  return (
    <>
      {blocks.map((block, index) => {
        return (
          <Group
            {...block}
            key={`group[${currentLayerIndex}]-${index}`}
            id={`group[${currentLayerIndex}]-${index}`}
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragMove={onDragMove}
            onClick={() => onActivate(index)}
            onTap={() => onActivate(index)}
            fill="lime"
          >
            <Rect
              width={block.width}
              height={block.height}
              x={0}
              y={0}
              key={`block[${currentLayerIndex}]-${index}`}
              id={`block[${currentLayerIndex}]-${index}`}
              fill={selected === index ? theme.colors.primaryAccent : theme.colors.white}
              stroke="#ddd"
              strokeWidth={1}
            />
            <Text
              width={block.width}
              height={block.height - 36}
              x={0}
              y={(block.rotated ? 36 : 0) + 36}
              key={`text[${currentLayerIndex}]-${index}`}
              id={`text[${currentLayerIndex}]-${index}`}
              text={`${block.order}`}
              fontSize={60}
              align="center"
            />
          </Group>
        );
      })}
    </>
  );
}
