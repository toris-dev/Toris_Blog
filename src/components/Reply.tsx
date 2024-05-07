import Button from './Button';

const Reply = () => {
  return (
    <div>
      <div className="ml-12 rounded-lg border-l border-gray-200 p-4 dark:border-gray-800">
        <div className="font-semibold">Replying to @jaredpalmer</div>
        <form className="grid gap-4">
          <div className="w-full">
            <div className="sr-only">Comment</div>
            <textarea
              className="min-h-[80px] resize-none text-sm"
              id="comment"
              placeholder="What are your thoughts?"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button className="peer text-sm" type="submit">
              Submit
            </Button>
            <Button className="peer text-sm">Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Reply;
