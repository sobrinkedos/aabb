/**
 * Hooks personalizados para usar Redux com TypeScript
 * 
 * Use estes hooks ao invés de useDispatch e useSelector padrão
 * para ter type safety automático
 */
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Hook useDispatch tipado
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Hook useSelector tipado
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
