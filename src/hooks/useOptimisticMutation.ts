
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Identifiable {
  id: string;
  [key: string]: unknown;
}

interface OptimisticMutationConfig<TData, TVariables> {
  queryKey: string[];
  mutationFn: (variables: TVariables) => Promise<TData>;
  successMessage: string;
  errorMessage: string;
  updateCache?: (oldData: Identifiable[], variables: TVariables) => Identifiable[];
  onSuccessCallback?: (data: TData) => void;
}

export const useOptimisticMutation = <TData, TVariables>({
  queryKey,
  mutationFn,
  successMessage,
  errorMessage,
  updateCache,
  onSuccessCallback,
}: OptimisticMutationConfig<TData, TVariables>) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      if (!updateCache) return;

      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: Identifiable[] | undefined) =>
        old ? updateCache(old, variables) : old
      );

      return { previousData };
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: successMessage,
      });
      onSuccessCallback?.(data);
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};

export const useOptimisticCreate = <TData, TVariables>(
  config: Omit<OptimisticMutationConfig<TData, TVariables>, 'updateCache'> & {
    createTempItem: (variables: TVariables) => Identifiable;
  }
) => {
  return useOptimisticMutation({
    ...config,
    updateCache: (oldData, variables) => {
      const tempItem = config.createTempItem(variables);
      return [...oldData, tempItem];
    },
  });
};

export const useOptimisticUpdate = <TData, TVariables extends { id: string }>(
  config: Omit<OptimisticMutationConfig<TData, TVariables>, 'updateCache'>
) => {
  return useOptimisticMutation({
    ...config,
    updateCache: (oldData, variables) =>
      oldData.map((item) =>
        item.id === variables.id
          ? { ...item, ...variables, updated_at: new Date().toISOString() }
          : item
      ),
  });
};

export const useOptimisticDelete = <TData, TVariables extends string>(
  config: Omit<OptimisticMutationConfig<TData, TVariables>, 'updateCache'>
) => {
  return useOptimisticMutation({
    ...config,
    updateCache: (oldData, deletedId) =>
      oldData.filter((item) => item.id !== deletedId),
  });
};
