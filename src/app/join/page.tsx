import { Suspense } from 'react';
import JoinView from '@/components/JoinView';

export default function JoinPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinView />
    </Suspense>
  );
}