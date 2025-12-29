import { NextRequest, NextResponse } from 'next/server';
import { TodoItem } from '@/types/todo';
import connectDB from '@/lib/mongodb';
import Todo from '@/models/Todo';

export async function GET() {
  try {
    await connectDB();

    // 누구나 할일을 조회할 수 있음
    const todos = await Todo.find({}).sort({ createdAt: -1 }).lean();

    // MongoDB 문서를 TodoItem 형식으로 변환
    const todosList: TodoItem[] = todos.map((todo) => ({
      id: todo._id.toString(),
      title: todo.title,
      description: todo.description,
      status: todo.status as TodoItem['status'],
      priority: todo.priority as TodoItem['priority'],
      dueDate: todo.dueDate,
      tags: todo.tags,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt
    }));

    return NextResponse.json({ todos: todosList });
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { todo, walletAddress } = body;

    // 인가된 지갑 주소 확인
    const authorizedAddresses = process.env.NEXT_PUBLIC_AUTHORIZED_ADDRESSES
      ? process.env.NEXT_PUBLIC_AUTHORIZED_ADDRESSES.split(',').map((addr) =>
          addr.trim().toLowerCase()
        )
      : [];

    if (!authorizedAddresses.includes(walletAddress?.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    // 새 할일 추가
    const now = new Date().toISOString();
    const newTodoDoc = new Todo({
      ...todo,
      createdAt: now,
      updatedAt: now
    });

    const savedTodo = await newTodoDoc.save();

    const newTodo: TodoItem = {
      id: savedTodo._id.toString(),
      title: savedTodo.title,
      description: savedTodo.description,
      status: savedTodo.status as TodoItem['status'],
      priority: savedTodo.priority as TodoItem['priority'],
      dueDate: savedTodo.dueDate,
      tags: savedTodo.tags,
      createdAt: savedTodo.createdAt,
      updatedAt: savedTodo.updatedAt
    };

    return NextResponse.json({ todo: newTodo }, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates, walletAddress } = body;

    // 인가된 지갑 주소 확인
    const authorizedAddresses = process.env.NEXT_PUBLIC_AUTHORIZED_ADDRESSES
      ? process.env.NEXT_PUBLIC_AUTHORIZED_ADDRESSES.split(',').map((addr) =>
          addr.trim().toLowerCase()
        )
      : [];

    if (!authorizedAddresses.includes(walletAddress?.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    // 할일 업데이트
    const updatedTodo = await Todo.findByIdAndUpdate(
      id,
      {
        ...updates,
        updatedAt: new Date().toISOString()
      },
      { new: true }
    );

    if (!updatedTodo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const todo: TodoItem = {
      id: updatedTodo._id.toString(),
      title: updatedTodo.title,
      description: updatedTodo.description,
      status: updatedTodo.status as TodoItem['status'],
      priority: updatedTodo.priority as TodoItem['priority'],
      dueDate: updatedTodo.dueDate,
      tags: updatedTodo.tags,
      createdAt: updatedTodo.createdAt,
      updatedAt: updatedTodo.updatedAt
    };

    return NextResponse.json({ todo });
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json(
      { error: 'Failed to update todo' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const walletAddress = searchParams.get('walletAddress');

    if (!id || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 인가된 지갑 주소 확인
    const authorizedAddresses = process.env.NEXT_PUBLIC_AUTHORIZED_ADDRESSES
      ? process.env.NEXT_PUBLIC_AUTHORIZED_ADDRESSES.split(',').map((addr) =>
          addr.trim().toLowerCase()
        )
      : [];

    if (!authorizedAddresses.includes(walletAddress.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    // 할일 삭제
    const deletedTodo = await Todo.findByIdAndDelete(id);

    if (!deletedTodo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json(
      { error: 'Failed to delete todo' },
      { status: 500 }
    );
  }
}
